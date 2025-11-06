import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/session';
import { signinWithGoogle } from '@/services/auth-service';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
const STATE_COOKIE_NAME = 'google_oauth_state';

function getAppBaseUrl() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  return baseUrl.replace(/\/$/, '');
}

function buildRedirectUri() {
  return `${getAppBaseUrl()}/api/auth/google/callback`;
}

function redirectWithError(message: string) {
  const redirectUrl = new URL(`/signin?error=${encodeURIComponent(message)}`, getAppBaseUrl());
  return NextResponse.redirect(redirectUrl, 302);
}

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured');
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: buildRedirectUri(),
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return (await response.json()) as {
    access_token: string;
    id_token?: string;
  };
}

async function fetchGoogleUser(accessToken: string) {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user info: ${errorText}`);
  }

  return (await response.json()) as {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const storedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
  const isProduction = process.env.NODE_ENV === 'production';

  if (error) {
    const response = redirectWithError(error);
    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      secure: isProduction,
    });
    return response;
  }

  if (!code || !state || !storedState || state !== storedState) {
    const response = redirectWithError('google_oauth_state_mismatch');
    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      secure: isProduction,
    });
    return response;
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code);
    const accessToken = tokenResponse.access_token;

    if (!accessToken) {
      throw new Error('Missing Google access token');
    }

    const googleUser = await fetchGoogleUser(accessToken);

    if (!googleUser.email || !googleUser.sub) {
      throw new Error('Google account does not have an email address');
    }

    await connectDB();

    const { sessionToken } = await signinWithGoogle(
      {
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      },
      {
        userModel: User,
        profileModel: Profile,
      },
    );

    const redirectUrl = new URL('/', getAppBaseUrl());
    const response = NextResponse.redirect(redirectUrl, 302);

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      secure: isProduction,
    });

    // Provide a short-lived flag for client-side welcome messages
    response.cookies.set({
      name: 'google_signin',
      value: 'true',
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });

    return response;
  } catch (exception) {
    console.error('Google OAuth callback error:', exception);
    const response = redirectWithError('google_oauth_failed');
    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      secure: isProduction,
    });
    return response;
  }
}

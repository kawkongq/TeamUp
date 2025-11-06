import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
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

export async function GET(_request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError('google_not_configured');
  }

  const state = randomBytes(16).toString('hex');
  const redirectUri = buildRedirectUri();

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);

  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.redirect(authUrl.toString(), 302);
  response.cookies.set({
    name: STATE_COOKIE_NAME,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}

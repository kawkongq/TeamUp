import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/session';
import { signinUser } from '@/services/auth-service';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

type SignInRequestBody = {
  email?: unknown;
  password?: unknown;
};

function parseRequestBody(body: SignInRequestBody) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  return { email, password };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignInRequestBody;
    const { email, password } = parseRequestBody(body);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    const { user, sessionToken } = await signinUser(
      { email, password },
      { userModel: User, profileModel: Profile },
    );

    const response = NextResponse.json({ success: true, user, message: 'Signed in successfully' });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, baseCookieConfig);

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    const message = error instanceof Error ? error.message : 'Signin failed';
    let status = 500;
    if (message.includes('Invalid email or password')) {
      status = 401;
    } else if (message.includes('deleted')) {
      status = 403;
    }
    return NextResponse.json({ error: message }, { status });
  }
}

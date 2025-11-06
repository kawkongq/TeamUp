import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/session';
import { signupUser } from '@/services/auth-service';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

type SignUpRequestBody = {
  email?: unknown;
  password?: unknown;
  name?: unknown;
  role?: unknown;
};

const allowedRoles = ['admin', 'user', 'organizer'] as const;

function parseRequestBody(body: SignUpRequestBody) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role =
    typeof body.role === 'string' && (allowedRoles as readonly string[]).includes(body.role)
      ? (body.role as typeof allowedRoles[number])
      : null;

  return { email, password, name, role };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignUpRequestBody;
    const { email, password, name, role } = parseRequestBody(body);

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and a valid role are required' },
        { status: 400 },
      );
    }

    await connectDB();

    const { user, sessionToken } = await signupUser(
      { email, password, name, role },
      { userModel: User, profileModel: Profile },
    );

    const response = NextResponse.json({ success: true, user, message: 'User created successfully' });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, baseCookieConfig);

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    const status = details.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: 'Signup failed', details }, { status });
  }
}

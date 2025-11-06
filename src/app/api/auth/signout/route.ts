import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/session';

const isProduction = process.env.NODE_ENV === 'production';

const expiredCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 0,
};

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      ...expiredCookieConfig,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}

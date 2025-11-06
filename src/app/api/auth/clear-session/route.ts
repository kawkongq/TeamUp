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
      message: 'Session cleared successfully',
    });

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      ...expiredCookieConfig,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Clear session error:', error);
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Create response with logout cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session cleared successfully'
    });

    // Set logout cookie to indicate user has logged out
    response.cookies.set('logged_out', 'true', {
      httpOnly: false, // Allow client-side access
      secure: false, // Allow HTTP in development
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Clear session error:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response with logout cookie
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully'
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
    console.error('Signout error:', error);
    return NextResponse.json(
      { error: 'Signout failed' },
      { status: 500 }
    );
  }
}

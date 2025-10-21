import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    
    console.log('🔍 Debug check-user called');
    console.log('Cookie user_id:', userId);

    if (!userId) {
      return NextResponse.json({
        error: 'No user_id cookie found',
        cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
      });
    }

    await connectDB();
    
    const user = await User.findById(userId);
    const profile = user ? await Profile.findOne({ userId: user._id.toString() }) : null;

    if (!user) {
      console.log('❌ User not found in database!');
      return NextResponse.json({
        error: 'User not found in database',
        userId: userId,
        suggestion: 'Clear cookies and sign in again'
      }, { status: 404 });
    }

    console.log('✅ User found:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt
      },
      profile: profile ? {
        id: profile._id.toString(),
        displayName: profile.displayName,
        role: profile.role
      } : null
    });

  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

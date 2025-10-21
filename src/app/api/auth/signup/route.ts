import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('🔵 Signup API called');
  try {
    const body = await request.json();
    const { email, password, name, role } = body;
    
    console.log('📝 Signup request:', { email, name, role });

    if (!email || !password || !name || !role) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'user', 'organizer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('❌ User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    console.log('✅ User does not exist, proceeding...');

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Create user
    console.log('👤 Creating user...');
    const user = await User.create({
      email,
      name,
      passwordHash: hashedPassword,
      role: role
    });
    console.log('✅ User created:', user._id.toString());
    
    // Verify user was actually saved
    const savedUser = await User.findById(user._id);
    if (!savedUser) {
      console.error('❌ User was not saved to database!');
      throw new Error('Failed to save user to database');
    }
    console.log('✅ User verified in database');

    // Create profile
    console.log('📋 Creating profile...');
    const profile = await Profile.create({
      userId: user._id.toString(),
      displayName: name,
      bio: '',
      role: role,
      timezone: 'UTC',
      isAvailable: true,
      skills: [],
      interests: []
    });
    console.log('✅ Profile created:', profile._id.toString());

    // Create response with user data
    console.log('📤 Sending success response');
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        profile: profile
      },
      message: 'User created successfully'
    });
    console.log('✅ Signup completed successfully!');

    // Set authenticated state
    response.cookies.set('logged_out', 'false', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set user ID cookie for session management
    response.cookies.set('user_id', user._id.toString(), {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Signup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

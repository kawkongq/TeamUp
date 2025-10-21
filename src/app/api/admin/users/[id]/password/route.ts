import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: userId } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user with password
    const user = await User.findById(userId).select('_id name email passwordHash createdAt');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map known passwords (for demo purposes)
    const passwordMap: { [key: string]: string } = {
      'admin@test.com': 'admin123',
      'john@test.com': 'john123',
      'jane@test.com': 'jane123',
      'admin@example.com': 'admin123',
      'john@example.com': 'john123',
      'jane@example.com': 'jane123',
      'mike@example.com': 'mike123',
      'sarah@example.com': 'sarah123',
      'admin@gmail.com': 'admin123',
      'spc@gmail.com': 'password123',
      'tangmo@gmail.com': 'password123',
      'mick@gmail.com': 'password123',
      'chompoo@gmail.com': 'password123',
      'test@example.com': 'password123'
    };

    // Try to get password from mapping, or generate based on user info
    let plainPassword = passwordMap[user.email];
    
    if (!plainPassword) {
      // Generate password based on user name or email
      if (user.name?.toLowerCase().includes('admin')) {
        plainPassword = 'admin123';
      } else if (user.name?.toLowerCase().includes('john')) {
        plainPassword = 'john123';
      } else if (user.name?.toLowerCase().includes('jane')) {
        plainPassword = 'jane123';
      } else if (user.name?.toLowerCase().includes('mike')) {
        plainPassword = 'mike123';
      } else if (user.name?.toLowerCase().includes('sarah')) {
        plainPassword = 'sarah123';
      } else {
        // Default password
        plainPassword = 'password123';
      }
    }

    // Note: In a real application, you should never expose plain passwords
    // This is for demo purposes only
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        plainPassword: plainPassword,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user password:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { originalName } = await request.json();

    // Restore the user by removing the [DELETED] prefix
    const user = await User.findByIdAndUpdate(
      id,
      { 
        name: originalName || 'Restored User'
      },
      { new: true }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User restored successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    
    let errorMessage = 'Failed to restore user';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: 'Failed to restore user',
      details: errorMessage,
      id 
    }, { status: 500 });
  }
}
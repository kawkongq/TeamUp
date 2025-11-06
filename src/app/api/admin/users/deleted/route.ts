// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    
    const deletedUsers = await User.find({
      name: { $regex: /^\[DELETED\]/ }
    })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedUsers = await Promise.all(
      deletedUsers.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id.toString() }).lean();
        
        return {
          id: user._id.toString(),
          originalName: user.name?.replace(/^\[DELETED\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/, '').trim() || 'Unknown',
          email: user.email,
          role: user.role || 'user',
          deletedAt: user.updatedAt.toISOString(),
          avatar: profile?.avatar
        };
      })
    );

    return NextResponse.json({ 
      deletedUsers: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deleted users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const currentUserId = searchParams.get('currentUserId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build search conditions
    const searchConditions: any = {
      $and: [
        { name: { $not: /^\[DELETED\]/ } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    };

    // Exclude current user if provided
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      searchConditions.$and.push({ _id: { $ne: currentUserId } });
    }

    // Get users (exclude deleted users and current user)
    const users = await User.find(searchConditions)
      .select('_id name email')
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    // Get profiles for these users
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id.toString() }).lean();
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profile: profile ? {
            displayName: profile.displayName,
            avatar: profile.avatar,
            role: profile.role
          } : null
        };
      })
    );

    return NextResponse.json({ users: usersWithProfiles });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
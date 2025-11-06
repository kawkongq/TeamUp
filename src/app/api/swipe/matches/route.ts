import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import Swipe from '@/models/Swipe';
import User from '@/models/User';
import { buildPersonSummary } from '@/lib/profile-utils';
import { toSanitizedId } from '@/lib/team-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const swipedUserIds = await Swipe.find({ swiperId: userId }).distinct<string>('swipeeId');
    
    const potentialMatches = await User.find({
      _id: { $nin: [userId, ...swipedUserIds] }, // Not the current user and not already swiped
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const usersWithProfiles = await Promise.all(
      potentialMatches.map(async (user) => {
        const userIdValue = toSanitizedId(user._id ?? user.id);
        if (!userIdValue) {
          return null;
        }

        const profile = await Profile.findOne({ userId: userIdValue }).lean();
        return buildPersonSummary(
          { ...user, _id: userIdValue, id: userIdValue },
          profile,
        );
      })
    );

    const people = usersWithProfiles.filter(
      (user): user is NonNullable<typeof user> => user !== null,
    );

    return NextResponse.json({
      success: true,
      people: people,
      count: people.length
    });

  } catch (error) {
    console.error('Matches API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch potential matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { buildPersonSummary } from '@/lib/profile-utils';
import { toSanitizedId } from '@/lib/team-response';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    
    const users = await User.find({
      name: { $not: /^\[DELETED\]/ }
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
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
      people
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

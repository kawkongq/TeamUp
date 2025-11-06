import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { buildBasicUserInfo } from '@/lib/profile-utils';
import { toSanitizedId } from '@/lib/team-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const currentUserId = searchParams.get('currentUserId');
    const limitInput = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isNaN(limitInput) ? 20 : Math.min(Math.max(limitInput, 1), 100);

    const conditions: Record<string, unknown>[] = [
      { name: { $not: /^\[DELETED\]/ } },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      },
    ];

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      conditions.push({ _id: { $ne: new Types.ObjectId(currentUserId) } });
    }

    const searchConditions: Record<string, unknown> = {
      $and: [
        ...conditions,
      ],
    };

    const users = await User.find(searchConditions)
      .select('_id name email')
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const userIdValue = toSanitizedId(user._id ?? user.id);
        if (!userIdValue) {
          return null;
        }
        const profile = await Profile.findOne({ userId: userIdValue }).lean();
        return buildBasicUserInfo(
          { ...user, _id: userIdValue, id: userIdValue },
          profile,
        );
      })
    );

    return NextResponse.json({
      users: usersWithProfiles.filter((user): user is NonNullable<typeof user> => Boolean(user)),
    });
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

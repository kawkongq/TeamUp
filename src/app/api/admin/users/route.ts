// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    
    const users = await User.find({
      name: { $not: /^\[DELETED\]/ }
    })
      .sort({ createdAt: -1 })
      .lean();

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id.toString() }).lean();
        const teamsOwned = await Team.countDocuments({ ownerId: user._id.toString() });
        const teamMemberships = await TeamMember.countDocuments({ userId: user._id.toString(), isActive: true });

        return {
          id: user._id.toString(),
          name: user.name || user.email,
          email: user.email,
          role: user.role || 'user',
          status: 'active',
          avatar: profile?.avatar,
          createdAt: user.createdAt.toISOString(),
          teamsOwned,
          teamMemberships
        };
      })
    );

    return NextResponse.json({ 
      users: usersWithDetails,
      total: usersWithDetails.length,
      active: usersWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

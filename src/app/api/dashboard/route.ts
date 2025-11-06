import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import User from '@/models/User';
import { buildBasicUserInfo } from '@/lib/profile-utils';
import { toIsoString, toSanitizedId } from '@/lib/team-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // For now, we'll fetch general stats. In a real app, you'd get the user ID from the session
    const userId = request.nextUrl.searchParams.get('userId');

    // Get total users count
    const totalUsers = await User.countDocuments({ name: { $not: /^\[DELETED\]/ } });
    
    // Get total teams count
    const totalTeams = await Team.countDocuments();
    
    // Get total events count
    const totalEvents = await Event.countDocuments();

    // Get user profile if userId is provided
    let userProfile: Record<string, unknown> | null = null;
    if (userId && Types.ObjectId.isValid(userId)) {
      userProfile = await Profile.findOne({ userId }).lean<Record<string, unknown> | null>();
    }

    // Get recent teams
    const recentTeams = await Team.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent events
    const recentEvents = await Event.find({
      startDate: { $gte: new Date() },
      isActive: { $ne: false }
    })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

    // Get user data
    let user: Record<string, unknown> | null = null;
    if (userId && Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean<Record<string, unknown> | null>();
    }

    // Calculate stats
    const stats = {
      totalProjects: totalTeams,
      completedProjects: Math.floor(totalTeams * 0.7), // Mock data
      totalEarnings: 0, // Mock data
      averageRating: 4.5, // Mock data
      totalUsers,
      totalEvents
    };

    // Format recent teams for display
    const formattedTeams = recentTeams.map((team) => {
      const id = toSanitizedId(team._id ?? team.id);
      return {
        id: id || String(team._id ?? team.id ?? ''),
        name: team.name ?? 'Unnamed team',
        description: typeof team.description === 'string' ? team.description : 'No description available',
        status: team.isActive === false ? 'Inactive' : 'Active',
        createdAt: toIsoString(team.createdAt),
      };
    });

    // Format recent events for display
    const formattedEvents = recentEvents.map((event) => {
      const id = toSanitizedId(event._id ?? event.id);
      return {
        id: id || String(event._id ?? event.id ?? ''),
        name: event.name ?? 'Unnamed event',
        description: typeof event.description === 'string' ? event.description : 'No description available',
        startDate: toIsoString(event.startDate),
        endDate: toIsoString(event.endDate),
        location: typeof event.location === 'string' ? event.location : 'Online',
      };
    });

    const basicUser = buildBasicUserInfo(user, null);
    const userResponse = basicUser
      ? {
          ...basicUser,
          profile: sanitizeDashboardProfile(userProfile),
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        stats,
        recentTeams: formattedTeams,
        recentEvents: formattedEvents
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function sanitizeDashboardProfile(profile: Record<string, unknown> | null) {
  if (!profile) {
    return null;
  }

  return {
    id: toSanitizedId(profile._id ?? profile.id) || undefined,
    displayName: typeof profile.displayName === 'string' ? profile.displayName : undefined,
    bio: typeof profile.bio === 'string' ? profile.bio : undefined,
    role: typeof profile.role === 'string' ? profile.role : undefined,
    timezone: typeof profile.timezone === 'string' ? profile.timezone : undefined,
    userId: typeof profile.userId === 'string' ? profile.userId : undefined,
  };
}

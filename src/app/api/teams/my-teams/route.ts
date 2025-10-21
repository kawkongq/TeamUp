import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Event from '@/models/Event';
import TeamMember from '@/models/TeamMember';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    
    if (!authData.authenticated || !authData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    await connectDB();
    
    // Get teams where user is owner
    const ownedTeams = await Team.find({
      ownerId: userId,
      isActive: true
    }).lean();

    // Get teams where user is member
    const memberTeamIds = await TeamMember.find({
      userId: userId,
      isActive: true
    }).distinct('teamId');

    const memberTeams = await Team.find({
      _id: { $in: memberTeamIds },
      isActive: true
    }).lean();

    // Combine and deduplicate teams
    const allTeamIds = new Set();
    const allTeams = [];
    
    [...ownedTeams, ...memberTeams].forEach(team => {
      if (!allTeamIds.has(team._id.toString())) {
        allTeamIds.add(team._id.toString());
        allTeams.push(team);
      }
    });

    // Get detailed information for each team
    const teamsWithDetails = await Promise.all(
      allTeams.map(async (team) => {
        const members = await TeamMember.find({ teamId: team._id.toString(), isActive: true });
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = await User.findById(member.userId);
            const profile = user ? await Profile.findOne({ userId: user._id.toString() }) : null;
            return {
              ...member.toObject(),
              id: member._id.toString(),
              user: {
                ...user?.toObject(),
                id: user?._id.toString(),
                profile
              }
            };
          })
        );

        const event = await Event.findById(team.eventId);

        return {
          ...team,
          id: team._id.toString(),
          members: membersWithDetails,
          event: {
            ...event?.toObject(),
            id: event?._id.toString()
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      teams: teamsWithDetails
    });

  } catch (error) {
    console.error('Get user teams error:', error);
    return NextResponse.json(
      { error: 'Failed to get user teams' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import { buildTeamResponse, toSanitizedId } from '@/lib/team-response';

type AuthCheckResponse = {
  authenticated: boolean;
  user?: {
    id: string;
  } | null;
};

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

    const authData = (await authResponse.json()) as AuthCheckResponse;
    
    if (!authData.authenticated || !authData.user?.id) {
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
    const uniqueTeams = new Map<string, Record<string, unknown>>();
    [...ownedTeams, ...memberTeams].forEach((team) => {
      const id = toSanitizedId(team?._id);
      if (id && !uniqueTeams.has(id)) {
        uniqueTeams.set(id, team as Record<string, unknown>);
      }
    });

    // Get detailed information for each team
    const teamsWithDetails = await Promise.all(
      Array.from(uniqueTeams.values()).map(async (team) => buildTeamResponse(team))
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

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Event from '@/models/Event';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';
import { buildTeamResponse, toSanitizedId } from '@/lib/team-response';
import { createTeamRecord } from '@/services/team-service';

interface CreateTeamPayload {
  name: string;
  description: string;
  ownerId: string;
  eventId: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    
    const teams = await Team.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const teamsWithDetails = await Promise.all(
      teams.map((team) => buildTeamResponse(team))
    );

    return NextResponse.json({
      success: true,
      teams: teamsWithDetails
    });
  } catch (error) {
    console.error('[Teams API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
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

    const body = await request.json();

    const validation = parseCreateTeamPayload(body);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const payload = validation.data;

    if (payload.ownerId !== authData.user.id) {
      return NextResponse.json(
        { error: 'You can only create teams for your own account' },
        { status: 403 }
      );
    }

    await connectDB();

    const teamWithDetails = await createTeamRecord(payload, {
      userModel: User,
      eventModel: Event,
      teamModel: Team,
      teamMemberModel: TeamMember,
    });

    return NextResponse.json({
      success: true,
      team: teamWithDetails
    });
  } catch (error) {
    console.error('[Teams API] POST Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create team';
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A team with this name already exists';
        status = 409;
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid user or event reference';
        status = 400;
      } else if (error.message.includes('owner')) {
        errorMessage = error.message;
        status = 404;
      } else if (error.message.includes('Event not found')) {
        errorMessage = error.message;
        status = 404;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}

function parseCreateTeamPayload(input: unknown):
  | { ok: true; data: CreateTeamPayload }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Invalid payload' };
  }

  const payload = input as Record<string, unknown>;

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const ownerId = toSanitizedId(payload.ownerId);
  const eventId = toSanitizedId(payload.eventId);
  const tags = typeof payload.tags === 'string' ? payload.tags.trim() : '';
  const lookingFor = typeof payload.lookingFor === 'string' ? payload.lookingFor.trim() : '';

  if (!name) {
    return { ok: false, error: 'Team name is required' };
  }

  if (!description) {
    return { ok: false, error: 'Team description is required' };
  }

  if (!ownerId) {
    return { ok: false, error: 'Team owner is required' };
  }

  if (!eventId) {
    return { ok: false, error: 'Event is required' };
  }

  const maxMembersRaw = payload.maxMembers;
  let maxMembers = 10;
  if (typeof maxMembersRaw === 'number') {
    maxMembers = maxMembersRaw;
  } else if (typeof maxMembersRaw === 'string' && maxMembersRaw.trim().length > 0) {
    const parsed = Number(maxMembersRaw);
    if (!Number.isNaN(parsed)) {
      maxMembers = parsed;
    }
  }

  if (!Number.isInteger(maxMembers) || maxMembers < 1 || maxMembers > 20) {
    return { ok: false, error: 'Max members must be an integer between 1 and 20' };
  }

  return {
    ok: true,
    data: {
      name,
      description,
      ownerId,
      eventId,
      maxMembers,
      tags,
      lookingFor,
    },
  };
}

import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import {
  buildTeamResponse,
  toIsoString,
  toSanitizedId,
} from '@/lib/team-response';

type AuthCheckResponse = {
  authenticated: boolean;
  user?: {
    id: string;
  } | null;
};

type RegisterPayload = {
  eventId?: unknown;
  message?: unknown;
};

type CancelPayload = {
  eventId?: unknown;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    const params = await context.params;
    const rawId = params.id;
    const teamId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const authResult = await getAuthenticatedUserId(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const { userId } = authResult;
    const body = (await request.json()) as RegisterPayload;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    const message =
      typeof body.message === 'string' && body.message.trim().length > 0
        ? body.message.trim()
        : undefined;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === userId;
    const isMember = await TeamMember.findOne({ teamId, userId, isActive: true });
    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You must be a team owner or member to register' },
        { status: 403 },
      );
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json({ error: 'Event is not active' }, { status: 400 });
    }

    const existingRegistration = await EventRegistration.findOne({ eventId, teamId });
    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Team is already registered for this event' },
        { status: 400 },
      );
    }

    const registration = await EventRegistration.create({
      eventId,
      teamId,
      message: message ?? null,
      status: 'PENDING',
    });

    const teamDetails = await buildTeamResponse(team.toObject());

    const registrationWithDetails = {
      id: toSanitizedId(registration._id),
      eventId,
      teamId,
      message: registration.message ?? null,
      status: registration.status ?? 'PENDING',
      createdAt: toIsoString(registration.createdAt),
      updatedAt: toIsoString(registration.updatedAt),
      team: teamDetails,
      event: {
        ...event.toObject(),
        id: event.id,
      },
    };

    return NextResponse.json({
      success: true,
      registration: registrationWithDetails,
    });
  } catch (error) {
    console.error('Team registration error:', error);

    const message = error instanceof Error ? error.message : 'Failed to register team for event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    const params = await context.params;
    const rawId = params.id;
    const teamId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const authResult = await getAuthenticatedUserId(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const { userId } = authResult;
    const body = (await request.json()) as CancelPayload;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner = team.ownerId === userId;
    const isMember = await TeamMember.findOne({ teamId, userId, isActive: true });
    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You must be a team owner or member to cancel registration' },
        { status: 403 },
      );
    }

    const registration = await EventRegistration.findOne({ eventId, teamId });
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    await EventRegistration.findByIdAndDelete(registration._id);

    return NextResponse.json({
      success: true,
      message: 'Team registration cancelled successfully',
    });
  } catch (error) {
    console.error('Team registration cancellation error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to cancel team registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getAuthenticatedUserId(
  request: NextRequest,
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  if (!authResponse.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const authData = (await authResponse.json()) as AuthCheckResponse;
  if (!authData.authenticated || !authData.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  return { ok: true, userId: authData.user.id };
}

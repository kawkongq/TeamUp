import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';
import {
  SanitizedTeam,
  buildTeamResponse,
  toIsoString,
  toSanitizedId,
} from '@/lib/team-response';

type AuthCheckResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    role?: string;
  } | null;
};

type CreateEventPayload = {
  name?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  location?: unknown;
  imageUrl?: unknown;
  type?: unknown;
  category?: unknown;
  tags?: unknown;
  maxTeams?: unknown;
};

type ParsedEventPayload = {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  imageUrl: string | null;
  type: string;
  category: string | null;
  tags: string | null;
  maxTeams: number | null;
};

type SanitizedEvent = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string | null;
  imageUrl: string | null;
  type: string;
  category: string | null;
  tags: string | null;
  maxTeams: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teams: SanitizedTeam[];
};

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const events = await Event.find({ isActive: true }).sort({ startDate: 1 }).exec();

    const eventsWithTeams: SanitizedEvent[] = await Promise.all(
      events.map(async (eventDoc) => {
        const teams = await Team.find({ eventId: eventDoc.id }).lean();
        const teamsWithDetails = await Promise.all(
          (teams ?? []).map(async (team) => buildTeamResponse(team)),
        );

        return {
          id: eventDoc.id,
          name: eventDoc.name,
          description: eventDoc.description ?? '',
          startDate: toIsoString(eventDoc.startDate),
          endDate: toIsoString(eventDoc.endDate),
          location: eventDoc.location ?? null,
          imageUrl: eventDoc.imageUrl ?? null,
          type: eventDoc.type,
          category: eventDoc.category ?? null,
          tags: eventDoc.tags ?? null,
          maxTeams: typeof eventDoc.maxTeams === 'number' ? eventDoc.maxTeams : null,
          isActive: eventDoc.isActive,
          createdAt: toIsoString(eventDoc.createdAt),
          updatedAt: toIsoString(eventDoc.updatedAt),
          teams: teamsWithDetails,
        };
      }),
    );

    return NextResponse.json({ success: true, events: eventsWithTeams });
  } catch (error) {
    console.error('Events GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authData = (await authResponse.json()) as AuthCheckResponse;
    const role = authData.user?.role;

    if (!authData.authenticated || !role) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (role !== 'organizer' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Only organizers and admins can create events.' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateEventPayload;
    const parsed = parseCreateEventPayload(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await connectDB();

    const event = await Event.create({
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      location: parsed.data.location,
      imageUrl: parsed.data.imageUrl,
      type: parsed.data.type,
      category: parsed.data.category,
      tags: parsed.data.tags,
      maxTeams: parsed.data.maxTeams,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: toSanitizedId(event._id),
        name: event.name,
        description: event.description ?? '',
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location ?? null,
        imageUrl: event.imageUrl ?? null,
        type: event.type,
        category: event.category ?? null,
        tags: event.tags ?? null,
        maxTeams: typeof event.maxTeams === 'number' ? event.maxTeams : null,
        isActive: event.isActive,
      },
    });
  } catch (error) {
    console.error('Events POST Error:', error);
    let errorMessage = 'Failed to create event';
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'An event with this name already exists';
      } else if (error.message.includes('Required')) {
        errorMessage = 'Missing required fields';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function parseCreateEventPayload(
  input: CreateEventPayload,
):
  | { ok: true; data: ParsedEventPayload }
  | { ok: false; error: string } {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const type = typeof input.type === 'string' ? input.type.trim() : '';

  if (!name) {
    return { ok: false, error: 'Event name is required' };
  }

  if (!type) {
    return { ok: false, error: 'Event type is required' };
  }

  const startDateRaw = typeof input.startDate === 'string' ? input.startDate : '';
  const endDateRaw = typeof input.endDate === 'string' ? input.endDate : '';

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, error: 'Invalid start or end date' };
  }

  const location =
    typeof input.location === 'string' && input.location.trim().length > 0
      ? input.location.trim()
      : null;
  const imageUrl =
    typeof input.imageUrl === 'string' && input.imageUrl.trim().length > 0
      ? input.imageUrl.trim()
      : null;
  const category =
    typeof input.category === 'string' && input.category.trim().length > 0
      ? input.category.trim()
      : null;
  const tags =
    typeof input.tags === 'string' && input.tags.trim().length > 0
      ? input.tags.trim()
      : null;

  let maxTeams: number | null = null;
  if (typeof input.maxTeams === 'number') {
    maxTeams = Number.isFinite(input.maxTeams) ? input.maxTeams : null;
  } else if (typeof input.maxTeams === 'string' && input.maxTeams.trim().length > 0) {
    const parsed = Number(input.maxTeams);
    maxTeams = Number.isFinite(parsed) ? parsed : null;
  }

  return {
    ok: true,
    data: {
      name,
      description,
      startDate,
      endDate,
      location,
      imageUrl,
      type,
      category,
      tags,
      maxTeams,
    },
  };
}

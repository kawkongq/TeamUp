import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Team from '@/models/Team';
import {
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    const params = await context.params;
    const rawId = params.id;
    const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authData = (await authResponse.json()) as AuthCheckResponse;
    if (!authData.authenticated || !authData.user?.role) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authData.user.role !== 'organizer' && authData.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const registrations = await EventRegistration.find({ eventId })
      .sort({ createdAt: -1 })
      .exec();

    const registrationsWithDetails = await Promise.all(
      registrations.map(async (registration) => {
        const team = await Team.findById(registration.teamId);
        const teamDetails = team ? await buildTeamResponse(team.toObject()) : null;

        return {
          id: toSanitizedId(registration._id),
          eventId: registration.eventId,
          teamId: registration.teamId,
          status: registration.status ?? 'PENDING',
          message: registration.message ?? null,
          createdAt: toIsoString(registration.createdAt),
          updatedAt: toIsoString(registration.updatedAt),
          team: teamDetails,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      registrations: registrationsWithDetails,
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get registrations';
    return NextResponse.json({ error: 'Failed to get registrations', details: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import { toIsoString, toSanitizedId } from '@/lib/team-response';

type AuthCheckResponse = {
  authenticated: boolean;
  user?: {
    id: string;
  } | null;
};

type RegistrationRecord = {
  _id: unknown;
  status?: string;
  createdAt?: Date | string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    await connectDB();

    const params = await context.params;
    const rawId = params.id;
    const teamId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        requiresAuth: true,
      });
    }

    const authData = (await authResponse.json()) as AuthCheckResponse;
    if (!authData.authenticated || !authData.user?.id) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        requiresAuth: true,
      });
    }

    const registration = await EventRegistration.findOne({ eventId, teamId }).lean<RegistrationRecord | null>();

    return NextResponse.json({
      success: true,
      isRegistered: Boolean(registration),
      requiresAuth: false,
      registration: registration
        ? {
            id: toSanitizedId(registration._id),
            status: registration.status || 'registered',
            createdAt: toIsoString(registration.createdAt),
          }
        : null,
    });
  } catch (error) {
    console.error('Check team registration status error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to check team registration status';
    return NextResponse.json(
      { error: 'Failed to check team registration status', details: message },
      { status: 500 },
    );
  }
}

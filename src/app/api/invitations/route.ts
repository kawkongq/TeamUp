import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import TeamInvitation from '@/models/TeamInvitation';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';
import { buildBasicUserInfo } from '@/lib/profile-utils';
import { toIsoString, toSanitizedId } from '@/lib/team-response';

type InvitationRecord = {
  _id: unknown;
  teamId: string;
  inviterId: string;
  inviteeId: string;
  message?: string;
  status?: string;
  createdAt?: Date | string;
  expiresAt?: Date | string;
};

type SanitizedInvitation = {
  id: string;
  message: string | null;
  createdAt: string;
  expiresAt: string | null;
  team: {
    id: string;
    name: string | null;
    description: string | null;
    memberCount: number;
    maxMembers: number | null;
    tags: string[];
    lookingFor: string[];
    owner: ReturnType<typeof buildBasicUserInfo>;
    event: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      location: string | null;
    } | null;
  } | null;
};

type TeamRecord = {
  _id?: unknown;
  name?: string;
  description?: string;
  ownerId?: string;
  eventId?: string;
  maxMembers?: number | string;
  tags?: unknown;
  lookingFor?: unknown;
};

type EventRecord = {
  _id?: unknown;
  name?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  location?: string;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const invitations = await TeamInvitation.find({
      inviteeId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .lean<InvitationRecord[]>();

    const formattedInvitations: SanitizedInvitation[] = await Promise.all(
      invitations.map(async (invitation) => {
        const team = await Team.findById(invitation.teamId).lean<TeamRecord | null>();
        const owner =
          team?.ownerId && typeof team.ownerId === 'string'
            ? await User.findById(team.ownerId).lean()
            : null;
        const ownerProfile =
          team?.ownerId && typeof team.ownerId === 'string'
            ? await Profile.findOne({ userId: team.ownerId }).lean()
            : null;
        const event =
          team?.eventId && typeof team.eventId === 'string'
            ? await Event.findById(team.eventId).lean<EventRecord | null>()
            : null;
        const memberCount = await TeamMember.countDocuments({ 
          teamId: invitation.teamId, 
          isActive: true 
        });

        const teamId = toSanitizedId(team?._id);

        return {
          id: toSanitizedId(invitation._id) || String(invitation._id),
          message: typeof invitation.message === 'string' ? invitation.message : null,
          createdAt: toIsoString(invitation.createdAt),
          expiresAt: invitation.expiresAt ? toIsoString(invitation.expiresAt) : null,
          team: team
            ? {
                id: teamId || String(team._id ?? ''),
                name: typeof team.name === 'string' ? team.name : null,
                description: typeof team.description === 'string' ? team.description : null,
                memberCount,
                maxMembers: typeof team.maxMembers === 'number' ? team.maxMembers : null,
                tags: Array.isArray(team.tags)
                  ? team.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
                  : typeof team.tags === 'string' && team.tags.trim().length > 0
                    ? team.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
                    : [],
                lookingFor: Array.isArray(team.lookingFor)
                  ? team.lookingFor.filter((item: unknown): item is string => typeof item === 'string')
                  : typeof team.lookingFor === 'string' && team.lookingFor.trim().length > 0
                    ? team.lookingFor.split(',').map((item: string) => item.trim()).filter(Boolean)
                    : [],
                owner: buildBasicUserInfo(owner, ownerProfile),
                event: event
                  ? {
                      id: toSanitizedId(event._id) || String(event._id ?? ''),
                      name: event.name ?? 'Event',
                      startDate: toIsoString(event.startDate),
                      endDate: toIsoString(event.endDate),
                      location: typeof event.location === 'string' ? event.location : null,
                    }
                  : null,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ 
      invitations: formattedInvitations,
      count: formattedInvitations.length
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch invitations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

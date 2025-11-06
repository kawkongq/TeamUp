import Event from '@/models/Event';
import JoinRequest from '@/models/JoinRequest';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';

export interface SanitizedUser {
  id: string;
  name?: string;
  email?: string;
  profile?: unknown;
}

export interface SanitizedMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  user: SanitizedUser | null;
}

export interface SanitizedJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  message: string;
  status: string;
  createdAt: string;
  user: SanitizedUser | null;
}

export interface SanitizedTeam {
  id: string;
  name: string;
  description: string;
  eventId: string;
  ownerId: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: SanitizedUser | null;
  event: (Record<string, unknown> & { id: string }) | null;
  members: SanitizedMember[];
  joinRequests: SanitizedJoinRequest[];
}

export async function buildTeamResponse(teamInput: unknown): Promise<SanitizedTeam> {
  if (!teamInput || typeof teamInput !== 'object') {
    throw new Error('Invalid team input provided');
  }

  const team = teamInput as Record<string, unknown>;
  const teamId = toSanitizedId(team._id ?? team.id);
  const ownerId = toSanitizedId(team.ownerId);
  const eventId = toSanitizedId(team.eventId);

  const ownerDoc = ownerId ? await User.findById(ownerId).lean() : null;
  const ownerProfile = ownerId ? await Profile.findOne({ userId: ownerId }).lean() : null;
  const eventDoc = eventId ? await Event.findById(eventId).lean() : null;
  const memberDocs = await TeamMember.find({ teamId }).lean();
  const joinRequestDocs = await JoinRequest.find({ teamId }).lean();

  const owner = ownerId && ownerDoc ? mapUser(ownerDoc, ownerProfile) : null;

  const event =
    eventDoc && eventId
      ? {
          ...eventDoc,
          id: eventId,
        }
      : null;

  const members: SanitizedMember[] = await Promise.all(
    (memberDocs ?? []).map(async (memberDoc, index) => {
      const memberId = toSanitizedId(memberDoc?._id ?? `${teamId}-member-${index}`);
      const memberUserId = toSanitizedId(memberDoc?.userId);
      const memberUserDoc = memberUserId ? await User.findById(memberUserId).lean() : null;
      const memberProfileDoc = memberUserId
        ? await Profile.findOne({ userId: memberUserId }).lean()
        : null;

      return {
        id: memberId,
        teamId,
        userId: memberUserId,
        role: typeof memberDoc?.role === 'string' ? memberDoc.role : 'member',
        joinedAt: toIsoString(memberDoc?.joinedAt),
        isActive: !(memberDoc?.isActive === false),
        user: memberUserDoc ? mapUser(memberUserDoc, memberProfileDoc) : null,
      };
    })
  );

  const joinRequests: SanitizedJoinRequest[] = await Promise.all(
    (joinRequestDocs ?? []).map(async (requestDoc, index) => {
      const requestId = toSanitizedId(requestDoc?._id ?? `${teamId}-request-${index}`);
      const requestUserId = toSanitizedId(requestDoc?.userId);
      const userDoc = requestUserId ? await User.findById(requestUserId).lean() : null;
      const profileDoc = requestUserId
        ? await Profile.findOne({ userId: requestUserId }).lean()
        : null;

      return {
        id: requestId,
        teamId,
        userId: requestUserId,
        message: typeof requestDoc?.message === 'string' ? requestDoc.message : '',
        status:
          typeof requestDoc?.status === 'string'
            ? requestDoc.status.toUpperCase()
            : 'PENDING',
        createdAt: toIsoString(requestDoc?.createdAt),
        user: userDoc ? mapUser(userDoc, profileDoc) : null,
      };
    })
  );

  return {
    id: teamId,
    name: typeof team.name === 'string' ? team.name : '',
    description: typeof team.description === 'string' ? team.description : '',
    eventId,
    ownerId,
    maxMembers:
      typeof team.maxMembers === 'number' ? team.maxMembers : Number(team.maxMembers ?? 10) || 10,
    tags: typeof team.tags === 'string' ? team.tags : '',
    lookingFor: typeof team.lookingFor === 'string' ? team.lookingFor : '',
    isActive: !(team.isActive === false),
    createdAt: toIsoString(team.createdAt),
    updatedAt: toIsoString(team.updatedAt),
    owner,
    event,
    members,
    joinRequests,
  };
}

export function mapUser(userDoc: unknown, profileDoc: unknown): SanitizedUser | null {
  if (!userDoc || typeof userDoc !== 'object') {
    return null;
  }

  const record = userDoc as Record<string, unknown>;
  const id = toSanitizedId(record._id ?? record.id);

  if (!id) {
    return null;
  }

  const name =
    typeof record.name === 'string'
      ? record.name
      : typeof record.email === 'string'
        ? record.email
        : undefined;
  const email = typeof record.email === 'string' ? record.email : undefined;

  return {
    id,
    name,
    email,
    profile: profileDoc ?? undefined,
  };
}

export function toSanitizedId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (
    value &&
    typeof value === 'object' &&
    'toString' in value &&
    typeof (value as { toString: () => unknown }).toString === 'function'
  ) {
    const converted = (value as { toString: () => unknown }).toString();
    const asString = typeof converted === 'string' ? converted : String(converted);
    return asString.trim();
  }

  return '';
}

export function toIsoString(value: unknown): string {
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date().toISOString();
}

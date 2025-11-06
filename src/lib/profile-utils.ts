import { toIsoString, toSanitizedId } from '@/lib/team-response';
import { normalizeAvatarUrl } from './avatar';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === 'object') {
    return value as UnknownRecord;
  }
  return null;
}

function getString(source: UnknownRecord | null, key: string): string | undefined {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function getBoolean(source: UnknownRecord | null, key: string): boolean | undefined {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'boolean' ? value : undefined;
}

function getNumber(source: UnknownRecord | null, key: string): number | undefined {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

function getStringArray(source: UnknownRecord | null, key: string): string[] {
  if (!source) {
    return [];
  }

  const value = source[key];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }

  return [];
}

export interface BasicProfileInfo {
  displayName?: string;
  avatar?: string | null;
  role?: string | null;
}

export interface BasicUserInfo {
  id: string;
  name?: string;
  email?: string;
  profile: BasicProfileInfo | null;
}

export interface PersonSummary {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  location: string | null;
  skills: string[];
  experience: string | null;
  interests: string[];
  status: 'available' | 'unavailable';
  bio: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  rating: number;
  projectsCompleted: number;
  hourlyRate: number | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export function buildBasicUserInfo(userDoc: unknown, profileDoc: unknown): BasicUserInfo | null {
  const userRecord = asRecord(userDoc);
  if (!userRecord) {
    return null;
  }

  const id = toSanitizedId(userRecord._id ?? userRecord.id);
  if (!id) {
    return null;
  }

  const name = getString(userRecord, 'name');
  const email = getString(userRecord, 'email');

  const profileRecord = asRecord(profileDoc);
  const profile: BasicProfileInfo | null = profileRecord
    ? {
        displayName: getString(profileRecord, 'displayName'),
        avatar: normalizeAvatarUrl(getString(profileRecord, 'avatar')) ?? null,
        role: getString(profileRecord, 'role') ?? null,
      }
    : null;

  return {
    id,
    name: name ?? email,
    email: email ?? undefined,
    profile,
  };
}

export function buildPersonSummary(
  userDoc: unknown,
  profileDoc: unknown,
): PersonSummary | null {
  const userRecord = asRecord(userDoc);
  const profileRecord = asRecord(profileDoc);

  if (!userRecord || !profileRecord) {
    return null;
  }

  const id = toSanitizedId(userRecord._id ?? userRecord.id);
  if (!id) {
    return null;
  }

  const isAvailable = getBoolean(profileRecord, 'isAvailable') ?? true;
  if (!isAvailable) {
    return null;
  }

  const links = asRecord(profileRecord.links);

  return {
    id,
    name:
      getString(profileRecord, 'displayName') ??
      getString(userRecord, 'name') ??
      getString(userRecord, 'email') ??
      'Anonymous',
    role: getString(profileRecord, 'role') ?? 'No role specified',
    avatar: normalizeAvatarUrl(getString(profileRecord, 'avatar')) ?? null,
    location: getString(profileRecord, 'location') ?? 'Location not specified',
    skills: getStringArray(profileRecord, 'skills'),
    experience: getString(profileRecord, 'experience') ?? 'Experience not specified',
    interests: getStringArray(profileRecord, 'interests'),
    status: isAvailable ? 'available' : 'unavailable',
    bio: getString(profileRecord, 'bio') ?? 'No bio available',
    github: getString(links, 'github') ?? getString(profileRecord, 'github') ?? null,
    linkedin: getString(links, 'linkedin') ?? getString(profileRecord, 'linkedin') ?? null,
    portfolio: getString(links, 'portfolio') ?? null,
    rating: getNumber(profileRecord, 'rating') ?? 0,
    projectsCompleted: getNumber(profileRecord, 'projectsCompleted') ?? 0,
    hourlyRate: getNumber(profileRecord, 'hourlyRate') ?? null,
    timezone: getString(profileRecord, 'timezone') ?? null,
    createdAt: toIsoString(userRecord.createdAt),
    updatedAt: toIsoString(userRecord.updatedAt),
  };
}

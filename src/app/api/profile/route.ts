import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import Skill from '@/models/Skill';
import Interest from '@/models/Interest';
import type { Document } from 'mongoose';
import type { IProfile } from '@/models/Profile';
import { normalizeAvatarUrl } from '@/lib/avatar';
type LeanProfile = Omit<IProfile, keyof Document> & {
  _id: IProfile['_id'];
};

interface LeanSkill {
  _id: string;
  name?: string;
  category?: string;
  icon?: string;
}

interface LeanInterest {
  _id: string;
  name?: string;
  category?: string;
  icon?: string;
}

interface NormalizedSkill {
  skillId: string;
  skill: LeanSkill | null;
}

interface NormalizedInterest {
  interestId: string;
  interest: LeanInterest | null;
}

interface ProfileResponse
  extends Omit<LeanProfile, 'skills' | 'interests' | '_id' | 'avatar'> {
  id: string;
  avatar: string | null;
  skills: NormalizedSkill[];
  interests: NormalizedInterest[];
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user ID from session or query params
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = await Profile.findOne({ userId }).lean<LeanProfile>();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get skill and interest details
    const skillsWithDetails = await normalizeSkills(profile.skills ?? []);
    const interestsWithDetails = await normalizeInterests(profile.interests ?? []);

    const profileWithDetails: ProfileResponse = {
      ...profile,
      avatar: normalizeAvatarUrl(profile.avatar) ?? null,
      id: toStringId(profile._id),
      skills: skillsWithDetails,
      interests: interestsWithDetails
    };

    return NextResponse.json({ profile: profileWithDetails });
  } catch (error) {
    console.error('Profile GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, skills, interests, ...profileData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const normalizedSkills = normalizeIdArray(skills);
    const normalizedInterests = normalizeIdArray(interests);

    // Update profile with skills and interests
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      {
        displayName: profileData.displayName,
        bio: profileData.bio,
        role: profileData.role,
        location: profileData.location,
        experience: profileData.experience,
        availability: profileData.availability,
        timezone: profileData.timezone,
        links: profileData.links,
        isAvailable: profileData.isAvailable,
        avatar: profileData.avatar,
        skills: normalizedSkills,
        interests: normalizedInterests
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).lean<LeanProfile>();

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Get skill and interest details for response
    const skillsWithDetails = await normalizeSkills(updatedProfile.skills ?? []);
    const interestsWithDetails = await normalizeInterests(updatedProfile.interests ?? []);

    const profileWithDetails: ProfileResponse = {
      ...updatedProfile,
      avatar: normalizeAvatarUrl(updatedProfile.avatar) ?? null,
      id: toStringId(updatedProfile._id),
      skills: skillsWithDetails,
      interests: interestsWithDetails
    };

    return NextResponse.json({ 
      success: true, 
      profile: profileWithDetails,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

function normalizeIdArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry) => {
      const value =
        typeof entry === 'object' && entry !== null
          ? 'skillId' in (entry as Record<string, unknown>)
            ? (entry as Record<string, unknown>).skillId
            : 'interestId' in (entry as Record<string, unknown>)
              ? (entry as Record<string, unknown>).interestId
              : undefined
          : entry;

      return typeof value === 'string' || typeof value === 'number'
        ? String(value).trim()
        : '';
    })
    .filter((id) => id.length > 0);
}

async function normalizeSkills(skillIds: unknown[]): Promise<NormalizedSkill[]> {
  const normalizedIds = normalizeIdArray(skillIds);

  const results = await Promise.all(
    normalizedIds.map(async (skillId) => {
      const skillDoc = await Skill.findById(skillId).lean();
      return { skillId, skill: toLeanSkill(skillDoc) };
    })
  );

  return results;
}

async function normalizeInterests(interestIds: unknown[]): Promise<NormalizedInterest[]> {
  const normalizedIds = normalizeIdArray(interestIds);

  const results = await Promise.all(
    normalizedIds.map(async (interestId) => {
      const interestDoc = await Interest.findById(interestId).lean();
      return { interestId, interest: toLeanInterest(interestDoc) };
    })
  );

  return results;
}

function toLeanSkill(doc: unknown): LeanSkill | null {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const { _id, name, category, icon } = doc as Partial<LeanSkill> & { _id?: unknown };
  if (!_id) {
    return null;
  }

  return {
    _id: toStringId(_id),
    name: typeof name === 'string' ? name : undefined,
    category: typeof category === 'string' ? category : undefined,
    icon: typeof icon === 'string' ? icon : undefined,
  };
}

function toLeanInterest(doc: unknown): LeanInterest | null {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const { _id, name, category, icon } = doc as Partial<LeanInterest> & { _id?: unknown };
  if (!_id) {
    return null;
  }

  return {
    _id: toStringId(_id),
    name: typeof name === 'string' ? name : undefined,
    category: typeof category === 'string' ? category : undefined,
    icon: typeof icon === 'string' ? icon : undefined,
  };
}

function toStringId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && 'toString' in value && typeof (value as { toString: () => unknown }).toString === 'function') {
    const converted = (value as { toString: () => unknown }).toString();
    return typeof converted === 'string' ? converted : String(converted);
  }

  return String(value ?? '');
}

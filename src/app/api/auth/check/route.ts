import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile, { IProfile } from '@/models/Profile';
import User, { IUser } from '@/models/User';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { isValidObjectId } from 'mongoose';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
};

const expiredCookieConfig = {
  ...baseCookieConfig,
  maxAge: 0 as const,
  expires: new Date(0),
};

type SanitisedProfile = Pick<
  IProfile,
  'displayName' | 'role' | 'avatar' | 'timezone' | 'skills' | 'interests' | 'isAvailable'
> & { id: string };

type SanitisedUser = {
  id: string;
  email: string;
  name: string;
  role: IUser['role'];
  profile: SanitisedProfile | null;
};

function sanitiseProfile(profile: IProfile | null): SanitisedProfile | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.displayName,
    role: profile.role,
    avatar: profile.avatar,
    timezone: profile.timezone,
    skills: profile.skills,
    interests: profile.interests,
    isAvailable: profile.isAvailable,
  };
}

function unauthenticatedResponse(note?: string) {
  return NextResponse.json({
    authenticated: false as const,
    user: null,
    timestamp: new Date().toISOString(),
    debug: {
      note: note ?? 'No authentication found',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionToken);

    if (!session) {
      const response = unauthenticatedResponse('Invalid or missing session');
      response.cookies.set(SESSION_COOKIE_NAME, '', expiredCookieConfig);
      return response;
    }

    const userId = session.sub;

    if (!isValidObjectId(userId)) {
      const response = unauthenticatedResponse('Invalid user ID format');
      response.cookies.set(SESSION_COOKIE_NAME, '', expiredCookieConfig);
      return response;
    }

    await connectDB();

    const user = (await User.findById(userId)) as IUser | null;
    if (!user || user.name?.startsWith('[DELETED]')) {
      const response = unauthenticatedResponse('User not found or deleted');
      response.cookies.set(SESSION_COOKIE_NAME, '', expiredCookieConfig);
      return response;
    }

    const profile = (await Profile.findOne({ userId: user.id })) as IProfile | null;

    const result: { authenticated: true; user: SanitisedUser; timestamp: string } = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: sanitiseProfile(profile),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Auth check error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Authentication check failed',
        details,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

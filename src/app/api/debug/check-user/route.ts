import { isValidObjectId } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile, { IProfile } from '@/models/Profile';
import User, { IUser } from '@/models/User';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

type SanitisedProfile = Pick<IProfile, 'displayName' | 'role' | 'avatar' | 'timezone'> & {
  id: string;
};

type SanitisedUser = {
  id: string;
  email: string;
  name: string;
  role: IUser['role'];
  hasPassword: boolean;
  createdAt: string;
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
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          error: 'No valid session cookie found',
          cookies: Object.fromEntries(
            request.cookies.getAll().map(({ name, value }) => [name, value]),
          ),
        },
        { status: 401 },
      );
    }

    const userId = session.sub;

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format in cookie',
          userId,
        },
        { status: 400 },
      );
    }

    await connectDB();

    const user = (await User.findById(userId)) as IUser | null;
    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found in database',
          userId,
          suggestion: 'Clear cookies and sign in again',
        },
        { status: 404 },
      );
    }

    const profile = (await Profile.findOne({ userId: user.id })) as IProfile | null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
      } satisfies SanitisedUser,
      profile: sanitiseProfile(profile),
    });
  } catch (error) {
    console.error('Debug check error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Debug check failed', details }, { status: 500 });
  }
}

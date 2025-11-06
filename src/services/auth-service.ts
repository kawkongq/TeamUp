import bcrypt from 'bcryptjs';

import Profile, { IProfile } from '@/models/Profile';
import User, { IUser } from '@/models/User';
import { createSessionToken } from '@/lib/session';

type UserModel = typeof User;
type ProfileModel = typeof Profile;

export type SignupInput = {
  email: string;
  password: string;
  name: string;
  role: IUser['role'];
};

export type SigninInput = {
  email: string;
  password: string;
};

export type AuthUserPayload = {
  id: string;
  email: string;
  name: string;
  role: IUser['role'];
  profile: SanitisedProfile | null;
};

export type SanitisedProfile = Pick<
  IProfile,
  'displayName' | 'role' | 'avatar' | 'timezone' | 'skills' | 'interests' | 'isAvailable'
> & { id: string };

export interface AuthDependencies {
  userModel?: UserModel;
  profileModel?: ProfileModel;
  hashPassword?: (password: string, saltRounds: number) => Promise<string>;
  comparePassword?: (password: string, hashed: string) => Promise<boolean>;
  sessionFactory?: (userId: string, role: IUser['role']) => string;
}

const defaultDeps: Required<AuthDependencies> = {
  userModel: User,
  profileModel: Profile,
  hashPassword: (password: string, saltRounds: number) => bcrypt.hash(password, saltRounds),
  comparePassword: (password: string, hashed: string) => bcrypt.compare(password, hashed),
  sessionFactory: createSessionToken,
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

export async function signupUser(
  input: SignupInput,
  dependencies: AuthDependencies = {},
): Promise<{ user: AuthUserPayload; sessionToken: string }> {
  const deps = { ...defaultDeps, ...dependencies };
  const { email, password, name, role } = input;

  if (!email || !password || !name || !role) {
    throw new Error('Email, password, name, and a valid role are required');
  }

  const existingUser = await deps.userModel.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await deps.hashPassword(password, 10);
  const user = await deps.userModel.create({
    email,
    name,
    passwordHash,
    role,
  });

  const profile = await deps.profileModel.create({
    userId: user.id,
    displayName: name,
    bio: '',
    role,
    timezone: 'UTC',
    isAvailable: true,
    skills: [],
    interests: [],
  });

  const sessionToken = deps.sessionFactory(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: sanitiseProfile(profile),
    },
    sessionToken,
  };
}

export async function signinUser(
  input: SigninInput,
  dependencies: AuthDependencies = {},
): Promise<{ user: AuthUserPayload; sessionToken: string }> {
  const deps = { ...defaultDeps, ...dependencies };
  const { email, password } = input;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await deps.userModel.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.name?.startsWith('[DELETED]')) {
    throw new Error('This account has been deleted and cannot be accessed');
  }

  const isValidPassword = await deps.comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const profile = await deps.profileModel.findOne({ userId: user.id });
  const sessionToken = deps.sessionFactory(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: sanitiseProfile(profile),
    },
    sessionToken,
  };
}

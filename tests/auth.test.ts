import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'crypto';

import { signupUser, signinUser } from '@/services/auth-service';

const hex = '0123456789abcdef';

function createObjectId() {
  return Array.from({ length: 24 }, () => hex[Math.floor(Math.random() * hex.length)]).join('');
}

function createAuthModels() {
  const users: any[] = [];
  const profiles: any[] = [];

  const userModel = {
    async findOne(query: { email?: string }) {
      if (!query.email) {
        return null;
      }
      const user = users.find((u) => u.email === query.email);
      return user ? { ...user } : null;
    },
    async create(doc: any) {
      const id = createObjectId();
      const created = {
        ...doc,
        _id: id,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(created);
      return { ...created };
    },
    async findById(id: string) {
      const user = users.find((u) => u._id === id || u.id === id);
      return user ? { ...user } : null;
    },
  };

  const profileModel = {
    async create(doc: any) {
      const id = createObjectId();
      const created = {
        ...doc,
        _id: id,
        id,
      };
      profiles.push(created);
      return { ...created };
    },
    async findOne(query: { userId?: string }) {
      if (!query.userId) {
        return null;
      }
      const profile = profiles.find((p) => p.userId === query.userId);
      return profile ? { ...profile } : null;
    },
  };

  return { users, profiles, userModel, profileModel };
}

process.env.NEXTAUTH_SECRET ||= randomBytes(16).toString('hex');

test('signup and signin flow returns session tokens and persists user data', async () => {
  const { users, profiles, userModel, profileModel } = createAuthModels();

  const signupResult = await signupUser(
    {
      email: 'alice@example.com',
      password: 'secret123',
      name: 'Alice',
      role: 'user',
    },
    { userModel: userModel as any, profileModel: profileModel as any },
  );

  assert.equal(signupResult.user.email, 'alice@example.com');
  assert.ok(signupResult.sessionToken);
  assert.equal(users.length, 1);
  assert.equal(profiles.length, 1);

  const signinResult = await signinUser(
    {
      email: 'alice@example.com',
      password: 'secret123',
    },
    { userModel: userModel as any, profileModel: profileModel as any },
  );

  assert.equal(signinResult.user.id, signupResult.user.id);
  assert.ok(signinResult.sessionToken);
});

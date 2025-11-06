import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'crypto';

import { createTeamRecord } from '@/services/team-service';

const hex = '0123456789abcdef';

function createObjectId() {
  return Array.from({ length: 24 }, () => hex[Math.floor(Math.random() * hex.length)]).join('');
}

function createTeamModels() {
  const users: any[] = [];
  const events: any[] = [];
  const teams: any[] = [];
  const members: any[] = [];
  const profiles: any[] = [];

  const userModel = {
    async findById(id: string) {
      const user = users.find((u) => u._id === id);
      return user ? { ...user } : null;
    },
  };

  const eventModel = {
    async findById(id: string) {
      const event = events.find((e) => e._id === id);
      return event ? { ...event } : null;
    },
  };

  const teamModel = {
    async create(doc: any) {
      const id = createObjectId();
      const created = {
        ...doc,
        _id: id,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      teams.push(created);
      return created;
    },
  };

  const teamMemberModel = {
    async create(doc: any) {
      const id = createObjectId();
      const created = {
        ...doc,
        _id: id,
        id,
        joinedAt: new Date(),
      };
      members.push(created);
      return created;
    },
  };

  return { users, events, teams, members, profiles, userModel, eventModel, teamModel, teamMemberModel };
}

process.env.NEXTAUTH_SECRET ||= randomBytes(16).toString('hex');

test('createTeamRecord creates a team and assigns owner membership', async () => {
  const { users, events, teams, members, userModel, eventModel, teamModel, teamMemberModel } =
    createTeamModels();

  const ownerId = createObjectId();
  const eventId = createObjectId();

  users.push({
    _id: ownerId,
    id: ownerId,
    name: 'Owner',
    email: 'owner@example.com',
  });

  events.push({
    _id: eventId,
    id: eventId,
    name: 'Hackathon',
    isActive: true,
  });

  const team = await createTeamRecord(
    {
      name: 'Team Alpha',
      description: 'Test team',
      ownerId,
      eventId,
      maxMembers: 4,
      tags: 'nextjs,typescript',
      lookingFor: 'designers',
    },
    {
      userModel: userModel as any,
      eventModel: eventModel as any,
      teamModel: teamModel as any,
      teamMemberModel: teamMemberModel as any,
      responseBuilder: async (doc) => ({
        id: doc._id,
        name: doc.name,
        description: doc.description,
        ownerId: doc.ownerId,
        eventId: doc.eventId,
        maxMembers: doc.maxMembers,
        tags: doc.tags,
        lookingFor: doc.lookingFor,
        isActive: true,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        owner: { id: ownerId, name: 'Owner', email: 'owner@example.com', profile: undefined },
        event: { id: eventId, name: 'Hackathon' },
        members: members.map((member) => ({
          id: member._id,
          teamId: member.teamId,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          isActive: member.isActive !== false,
          user: { id: ownerId, name: 'Owner', email: 'owner@example.com', profile: undefined },
        })),
        joinRequests: [],
      }),
    },
  );

  assert.equal(teams.length, 1);
  assert.equal(members.length, 1);
  assert.equal(team.ownerId, ownerId);
  assert.equal(team.members[0].userId, ownerId);
});

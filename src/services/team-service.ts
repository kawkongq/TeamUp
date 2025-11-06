import Event from '@/models/Event';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';
import { buildTeamResponse, SanitizedTeam } from '@/lib/team-response';

type UserModel = typeof User;
type EventModel = typeof Event;
type TeamModel = typeof Team;
type TeamMemberModel = typeof TeamMember;

export type CreateTeamInput = {
  name: string;
  description: string;
  ownerId: string;
  eventId: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
};

export interface TeamDependencies {
  userModel?: UserModel;
  eventModel?: EventModel;
  teamModel?: TeamModel;
  teamMemberModel?: TeamMemberModel;
  responseBuilder?: typeof buildTeamResponse;
}

const defaultTeamDeps: Required<TeamDependencies> = {
  userModel: User,
  eventModel: Event,
  teamModel: Team,
  teamMemberModel: TeamMember,
  responseBuilder: buildTeamResponse,
};

export async function createTeamRecord(
  input: CreateTeamInput,
  dependencies: TeamDependencies = {},
): Promise<SanitizedTeam> {
  const deps = { ...defaultTeamDeps, ...dependencies };
  const { name, description, ownerId, eventId, maxMembers, tags, lookingFor } = input;

  if (!name || !description || !ownerId || !eventId) {
    throw new Error('Invalid team payload');
  }

  const owner = await deps.userModel.findById(ownerId);
  if (!owner) {
    throw new Error('Team owner not found');
  }

  const event = await deps.eventModel.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const team = await deps.teamModel.create({
    name,
    description,
    ownerId,
    eventId,
    maxMembers,
    tags,
    lookingFor,
    isActive: true,
  });

  await deps.teamMemberModel.create({
    teamId: team.id ?? team._id?.toString(),
    userId: ownerId,
    role: 'owner',
    isActive: true,
  });

  return deps.responseBuilder(team);
}

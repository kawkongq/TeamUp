import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';

import connectDB from '@/lib/mongodb';
import JoinRequest from '@/models/JoinRequest';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';
import Profile from '@/models/Profile';
import {
  mapUser,
  toIsoString,
  toSanitizedId,
} from '@/lib/team-response';

type JoinRequestAction = 'approve' | 'reject';

type ProcessRequestPayload = {
  requestId?: unknown;
  action?: unknown;
  ownerId?: unknown;
};

type JoinRequestRecord = {
  _id: Types.ObjectId;
  teamId: string;
  userId: string;
  message?: string;
  status: string;
  createdAt: Date;
};

type TeamRecord = {
  ownerId: string;
  maxMembers?: number;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    await connectDB();

    const params = await context.params;
    const rawId = params.id;
    const teamId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const ownerId = toSanitizedId(searchParams.get('ownerId'));

    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const team = await Team.findById(teamId).lean<TeamRecord | null>();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'Only team owners can view join requests' },
        { status: 403 },
      );
    }

    const requests =
      (await JoinRequest.find({ teamId }).sort({ createdAt: -1 }).lean<JoinRequestRecord[]>()) ?? [];

    const requestsWithUsers = await Promise.all(
      requests.map(async (joinRequest) => {
        const user = await User.findById(joinRequest.userId).lean();
        const profile = await Profile.findOne({ userId: joinRequest.userId }).lean();

        return {
          id: toSanitizedId(joinRequest._id),
          teamId: joinRequest.teamId,
          userId: joinRequest.userId,
          message: typeof joinRequest.message === 'string' ? joinRequest.message : '',
          status:
            typeof joinRequest.status === 'string'
              ? joinRequest.status.toLowerCase()
              : 'pending',
          createdAt: toIsoString(joinRequest.createdAt),
          user: mapUser(user, profile),
        };
      }),
    );

    return NextResponse.json({ requests: requestsWithUsers });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error while fetching requests';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    await connectDB();

    const params = await context.params;
    const rawId = params.id;
    const teamId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    const body = (await request.json()) as ProcessRequestPayload;

    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    const actionRaw = typeof body.action === 'string' ? body.action.trim().toLowerCase() : '';
    const ownerId = typeof body.ownerId === 'string' ? body.ownerId.trim() : '';

    if (!requestId || !actionRaw || !ownerId) {
      return NextResponse.json(
        { error: 'Request ID, action, and owner ID are required' },
        { status: 400 },
      );
    }

    if (actionRaw !== 'approve' && actionRaw !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 },
      );
    }

    const action = actionRaw as JoinRequestAction;

    if (
      !Types.ObjectId.isValid(teamId) ||
      !Types.ObjectId.isValid(requestId) ||
      !Types.ObjectId.isValid(ownerId)
    ) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const team = await Team.findById(teamId).lean<TeamRecord | null>();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'Only team owners can process join requests' },
        { status: 403 },
      );
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (joinRequest.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Join request does not belong to this team' },
        { status: 400 },
      );
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Join request has already been processed' },
        { status: 400 },
      );
    }

    if (action === 'approve') {
      const memberCount = await TeamMember.countDocuments({ teamId, isActive: true });
      const maxMembers =
        typeof team.maxMembers === 'number'
          ? team.maxMembers
          : Number(team.maxMembers ?? 0) || 0;
      if (maxMembers > 0 && memberCount >= maxMembers) {
        return NextResponse.json({ error: 'Team is already full' }, { status: 400 });
      }

      const existingMember = await TeamMember.findOne({
        teamId,
        userId: joinRequest.userId,
        isActive: true,
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this team' },
          { status: 400 },
        );
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await JoinRequest.findByIdAndUpdate(
            requestId,
            { status: 'approved' },
            { session },
          );

          await TeamMember.create(
            [
              {
                teamId,
                userId: joinRequest.userId,
                role: 'member',
                isActive: true,
                joinedAt: new Date(),
              },
            ],
            { session },
          );
        });
      } finally {
        await session.endSession();
      }

      return NextResponse.json({
        success: true,
        message: 'Join request approved and user added to team',
      });
    }

    await JoinRequest.findByIdAndUpdate(requestId, { status: 'rejected' });

    return NextResponse.json({
      success: true,
      message: 'Join request rejected',
    });
  } catch (error) {
    console.error('Error processing join request:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error while processing request';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}

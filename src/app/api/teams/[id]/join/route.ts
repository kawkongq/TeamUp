import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import JoinRequest from '@/models/JoinRequest';
import { Types } from 'mongoose';

type JoinRequestPayload = {
  userId?: unknown;
  message?: unknown;
};

type LeanTeam = {
  _id: Types.ObjectId;
  maxMembers?: number;
  ownerId: string;
};

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
    const body = (await request.json()) as JoinRequestPayload;
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const message =
      typeof body.message === 'string' && body.message.trim().length > 0
        ? body.message.trim()
        : undefined;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if team exists
    const team = await Team.findById(teamId).lean<LeanTeam | null>();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if team is full
    const memberCount = await TeamMember.countDocuments({ teamId, isActive: true });
    if (typeof team.maxMembers === 'number' && memberCount >= team.maxMembers) {
      return NextResponse.json({ error: 'Team is already full' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await TeamMember.findOne({
      teamId,
      userId,
      isActive: true
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Check if join request already exists
    const existingRequest = await JoinRequest.findOne({
      teamId,
      userId
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Join request already exists' }, { status: 400 });
      } else {
        // Update existing request to pending if it was rejected/approved before
        await JoinRequest.findByIdAndUpdate(existingRequest._id, {
          status: 'pending',
          message: message ?? null,
          updatedAt: new Date()
        });
      }
    } else {
      // Create new join request
      const joinRequest = new JoinRequest({
        teamId,
        userId,
        message: message ?? null,
        status: 'pending'
      });
      await joinRequest.save();
    }

    return NextResponse.json({ 
      success: true,
      message: 'Join request sent successfully'
    });
  } catch (error) {
    console.error('Error sending join request:', error);
    return NextResponse.json({ 
      error: 'Failed to send join request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

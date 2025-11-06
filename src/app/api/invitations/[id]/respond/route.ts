import mongoose, { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamInvitation from '@/models/TeamInvitation';
import TeamMember from '@/models/TeamMember';

type RouteParams = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

type RespondPayload = {
  action?: unknown;
};

type InvitationRecord = {
  _id?: unknown;
  teamId: string;
  inviteeId: string;
  status?: string;
  expiresAt?: Date | string;
};

type TeamRecord = {
  _id?: unknown;
  maxMembers?: number | string;
  ownerId?: string;
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    await connectDB();
    
    const params = await context.params;
    const rawId = params.id;
    const invitationId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!invitationId || !Types.ObjectId.isValid(invitationId)) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    const body = (await request.json()) as RespondPayload;
    const action = typeof body.action === 'string' ? body.action.toLowerCase() : '';

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "reject"' }, { status: 400 });
    }

    const invitation = await TeamInvitation.findById(invitationId).lean<InvitationRecord | null>();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been responded to' }, { status: 400 });
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    if (typeof invitation.teamId !== 'string' || typeof invitation.inviteeId !== 'string') {
      return NextResponse.json({ error: 'Invitation data is invalid' }, { status: 500 });
    }

    if (action === 'accept') {
      const team = await Team.findById(invitation.teamId).lean<TeamRecord | null>();
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      const memberCount = await TeamMember.countDocuments({ 
        teamId: invitation.teamId, 
        isActive: true 
      });
      
      const maxMembers =
        typeof team.maxMembers === 'number'
          ? team.maxMembers
          : Number(team.maxMembers ?? 0) || 0;
      if (maxMembers > 0 && memberCount >= maxMembers) {
        return NextResponse.json({ error: 'Team is already full' }, { status: 400 });
      }

      // Check if user is already a member
      const existingMember = await TeamMember.findOne({
        teamId: invitation.teamId,
        userId: invitation.inviteeId,
        isActive: true
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
      }

      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          await TeamInvitation.findByIdAndUpdate(invitationId, {
            status: 'accepted',
            respondedAt: new Date(),
          }, { session });

          await TeamMember.create([{
            teamId: invitation.teamId,
            userId: invitation.inviteeId,
            role: 'member',
            isActive: true,
            joinedAt: new Date()
          }], { session });
        });

        return NextResponse.json({ 
          success: true,
          message: 'Invitation accepted successfully',
          action: 'accepted'
        });
      } finally {
        await session.endSession();
      }
    } else {
      await TeamInvitation.findByIdAndUpdate(invitationId, {
        status: 'declined',
        respondedAt: new Date()
      });

      return NextResponse.json({ 
        success: true,
        message: 'Invitation rejected',
        action: 'rejected'
      });
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to respond to invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

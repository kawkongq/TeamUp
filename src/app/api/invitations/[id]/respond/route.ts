import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeamInvitation from '@/models/TeamInvitation';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "reject"' }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    // Get the invitation
    const invitation = await TeamInvitation.findById(id).lean();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been responded to' }, { status: 400 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    if (action === 'accept') {
      // Get team details
      const team = await Team.findById(invitation.teamId).lean();
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Check if team is full
      const memberCount = await TeamMember.countDocuments({ 
        teamId: invitation.teamId, 
        isActive: true 
      });
      
      if (team.maxMembers && memberCount >= team.maxMembers) {
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

      // Use MongoDB session for transaction-like behavior
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Accept invitation: update status and create team member
          await TeamInvitation.findByIdAndUpdate(
            id,
            { 
              status: 'accepted', 
              respondedAt: new Date() 
            },
            { session }
          );

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
      // Reject invitation: update status only
      await TeamInvitation.findByIdAndUpdate(id, {
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
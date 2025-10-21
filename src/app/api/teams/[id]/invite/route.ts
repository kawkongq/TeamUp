import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import TeamInvitation from '@/models/TeamInvitation';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, inviterId, message } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if team exists
    const team = await Team.findById(teamId).lean();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // If inviterId is provided, validate it and check ownership
    // If not provided, try to get from authentication or use team owner
    let actualInviterId = inviterId;

    if (!actualInviterId) {
      // Try to get current user from authentication
      try {
        const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated && authData.user) {
            actualInviterId = authData.user.id;
          }
        }
      } catch (authError) {
        console.log('Could not get authenticated user, using team owner');
      }

      // Fallback to team owner if no authenticated user
      if (!actualInviterId) {
        actualInviterId = team.ownerId;
      }
    }

    if (!mongoose.Types.ObjectId.isValid(actualInviterId)) {
      return NextResponse.json({ error: 'Invalid inviter ID' }, { status: 400 });
    }

    // Check if inviter is the team owner (only team owner can send invitations)
    if (actualInviterId !== team.ownerId) {
      return NextResponse.json({ error: 'Only team owner can send invitations' }, { status: 403 });
    }

    // Check if team is full
    const memberCount = await TeamMember.countDocuments({ teamId, isActive: true });
    if (team.maxMembers && memberCount >= team.maxMembers) {
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

    // Check if invitation already exists
    const existingInvitation = await TeamInvitation.findOne({
      teamId,
      inviteeId: userId,
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent to this user' }, { status: 400 });
    }

    // Create new invitation
    const invitation = new TeamInvitation({
      teamId,
      inviterId: actualInviterId,
      inviteeId: userId,
      message: message || `You've been invited to join ${team.name}!`,
      status: 'pending'
    });

    await invitation.save();

    return NextResponse.json({ 
      success: true,
      message: 'Team invitation sent successfully',
      invitation: {
        id: invitation._id.toString(),
        teamId: invitation.teamId,
        inviterId: invitation.inviterId,
        inviteeId: invitation.inviteeId,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending team invitation:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to send team invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
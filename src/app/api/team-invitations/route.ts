import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import TeamInvitation from '@/models/TeamInvitation';
import User from '@/models/User';
import Profile from '@/models/Profile';
import mongoose from 'mongoose';

// POST /api/team-invitations - Send team invitation
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { teamId, inviterId, inviteeId, message } = body;

    if (!teamId || !inviteeId) {
      return NextResponse.json(
        { error: 'Team ID and invitee ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(inviteeId)) {
      return NextResponse.json({ error: 'Invalid team ID or invitee ID' }, { status: 400 });
    }

    // Check if team exists and get team info
    const team = await Team.findById(teamId).lean();
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get actual inviter ID
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

    // Check if inviter is the team owner
    if (team.ownerId !== actualInviterId) {
      return NextResponse.json(
        { error: 'Only team owner can send invitations' },
        { status: 403 }
      );
    }

    // Check if team is full
    const memberCount = await TeamMember.countDocuments({ teamId, isActive: true });
    if (memberCount >= team.maxMembers) {
      return NextResponse.json(
        { error: 'Team is full' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const isAlreadyMember = await TeamMember.findOne({ 
      teamId, 
      userId: inviteeId, 
      isActive: true 
    });
    if (isAlreadyMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await TeamInvitation.findOne({
      teamId,
      inviteeId,
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'User already has a pending invitation for this team' },
        { status: 400 }
      );
    }

    // Create the invitation
    const invitation = new TeamInvitation({
      teamId,
      inviterId: actualInviterId,
      inviteeId,
      message: message || `You've been invited to join ${team.name}!`,
      status: 'pending'
    });

    await invitation.save();

    // Get invitation details for response
    const inviter = await User.findById(inviterId).lean();
    const invitee = await User.findById(inviteeId).lean();
    const inviterProfile = await Profile.findOne({ userId: inviterId }).lean();
    const inviteeProfile = await Profile.findOne({ userId: inviteeId }).lean();

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id.toString(),
        teamId: invitation.teamId,
        inviterId: invitation.inviterId,
        inviteeId: invitation.inviteeId,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.createdAt,
        team: {
          id: team._id.toString(),
          name: team.name,
          description: team.description
        },
        inviter: {
          id: inviter?._id.toString(),
          name: inviter?.name,
          email: inviter?.email,
          profile: inviterProfile
        },
        invitee: {
          id: invitee?._id.toString(),
          name: invitee?.name,
          email: invitee?.email,
          profile: inviteeProfile
        }
      }
    });

  } catch (error) {
    console.error('Error sending team invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/team-invitations - Get user's invitations
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const invitations = await TeamInvitation.find({
      inviteeId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Only non-expired invitations
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get detailed information for each invitation
    const detailedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const team = await Team.findById(invitation.teamId).lean();
        const inviter = await User.findById(invitation.inviterId).lean();
        const inviterProfile = await Profile.findOne({ userId: invitation.inviterId }).lean();
        
        // Get current member count
        const memberCount = await TeamMember.countDocuments({ 
          teamId: invitation.teamId, 
          isActive: true 
        });

        return {
          id: invitation._id.toString(),
          teamId: invitation.teamId,
          inviterId: invitation.inviterId,
          message: invitation.message,
          status: invitation.status,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
          team: {
            id: team?._id.toString(),
            name: team?.name,
            description: team?.description,
            maxMembers: team?.maxMembers,
            currentMembers: memberCount
          },
          inviter: {
            id: inviter?._id.toString(),
            name: inviter?.name,
            email: inviter?.email,
            profile: inviterProfile
          }
        };
      })
    );

    return NextResponse.json({ invitations: detailedInvitations });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
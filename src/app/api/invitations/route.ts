import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeamInvitation from '@/models/TeamInvitation';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Event from '@/models/Event';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get pending team invitations for this user
    const invitations = await TeamInvitation.find({
      inviteeId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Only non-expired invitations
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const team = await Team.findById(invitation.teamId).lean();
        const owner = await User.findById(team?.ownerId).lean();
        const ownerProfile = await Profile.findOne({ userId: team?.ownerId }).lean();
        const event = team?.eventId ? await Event.findById(team.eventId).lean() : null;
        const memberCount = await TeamMember.countDocuments({ 
          teamId: invitation.teamId, 
          isActive: true 
        });

        return {
          id: invitation._id.toString(),
          message: invitation.message,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt?.toISOString(),
          team: {
            id: team?._id.toString(),
            name: team?.name,
            description: team?.description,
            memberCount,
            maxMembers: team?.maxMembers,
            tags: team?.tags || [],
            lookingFor: team?.lookingFor || [],
            owner: {
              id: owner?._id.toString(),
              name: owner?.name || owner?.email,
              email: owner?.email,
              avatar: ownerProfile?.avatar
            },
            event: event ? {
              id: event._id.toString(),
              name: event.name,
              startDate: event.startDate.toISOString(),
              endDate: event.endDate.toISOString(),
              location: event.location
            } : null
          }
        };
      })
    );

    return NextResponse.json({ 
      invitations: formattedInvitations,
      count: formattedInvitations.length
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch invitations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
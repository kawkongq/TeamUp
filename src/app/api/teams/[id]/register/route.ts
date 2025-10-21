import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Team from '@/models/Team';
import Event from '@/models/Event';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    console.log('[Team Registration API] Starting registration for team:', teamId);
    
    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    
    if (!authData.authenticated || !authData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const body = await request.json();
    const { eventId, message } = body;

    console.log('[Team Registration API] User ID:', userId, 'Team ID:', teamId, 'Event ID:', eventId);

    await connectDB();
    
    // Check if team exists and user is the owner or member
    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is team owner or member
    const isOwner = team.ownerId === userId;
    const isMember = await TeamMember.findOne({ teamId, userId, isActive: true });

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You must be a team owner or member to register' },
        { status: 403 }
      );
    }

    // Check if event exists and is active
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.isActive) {
      return NextResponse.json(
        { error: 'Event is not active' },
        { status: 400 }
      );
    }

    // Check if team is already registered for this event
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      teamId
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Team is already registered for this event' },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await EventRegistration.create({
      eventId,
      teamId,
      message,
      status: 'PENDING'
    });

    // Get populated data for response
    const owner = await User.findById(team.ownerId);
    const ownerProfile = await Profile.findOne({ userId: team.ownerId });
    const members = await TeamMember.find({ teamId, isActive: true });
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await User.findById(member.userId);
        const profile = await Profile.findOne({ userId: member.userId });
        return {
          ...member.toObject(),
          user: {
            ...user?.toObject(),
            profile
          }
        };
      })
    );

    const registrationWithDetails = {
      ...registration.toObject(),
      id: registration._id.toString(),
      team: {
        ...team.toObject(),
        id: team._id.toString(),
        owner: {
          ...owner?.toObject(),
          id: owner?._id.toString(),
          profile: ownerProfile
        },
        members: membersWithDetails
      },
      event: {
        ...event.toObject(),
        id: event._id.toString()
      }
    };

    return NextResponse.json({
      success: true,
      registration: registrationWithDetails
    });

  } catch (error) {
    console.error('Team registration error:', error);
    
    let errorMessage = 'Failed to register team for event';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    
    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    
    if (!authData.authenticated || !authData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const { eventId } = await request.json();

    await connectDB();
    
    // Check if team exists and user is the owner
    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is team owner or member
    const isOwner = team.ownerId === userId;
    const isMember = await TeamMember.findOne({ teamId, userId, isActive: true });

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You must be a team owner or member to cancel registration' },
        { status: 403 }
      );
    }

    // Find and delete registration
    const registration = await EventRegistration.findOne({
      eventId,
      teamId
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    await EventRegistration.findByIdAndDelete(registration._id);

    return NextResponse.json({
      success: true,
      message: 'Team registration cancelled successfully'
    });

  } catch (error) {
    console.error('Team registration cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel team registration' },
      { status: 500 }
    );
  }
}
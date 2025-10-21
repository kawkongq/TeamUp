import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Event from '@/models/Event';
import TeamMember from '@/models/TeamMember';

export async function GET(request: NextRequest) {
  try {
    console.log('[Teams API] GET request received');
    
    await connectDB();
    
    const teams = await Team.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const owner = await User.findById(team.ownerId).lean();
        const ownerProfile = owner ? await Profile.findOne({ userId: owner._id.toString() }).lean() : null;
        const event = await Event.findById(team.eventId).lean();
        
        const members = await TeamMember.find({ teamId: team._id.toString(), isActive: true }).lean();
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = await User.findById(member.userId).lean();
            const profile = user ? await Profile.findOne({ userId: user._id.toString() }).lean() : null;
            return {
              ...member,
              id: member._id.toString(),
              user: {
                ...user,
                id: user?._id.toString(),
                profile
              }
            };
          })
        );

        return {
          ...team,
          id: team._id.toString(),
          owner: {
            ...owner,
            id: owner?._id.toString(),
            profile: ownerProfile
          },
          event: {
            ...event,
            id: event?._id.toString()
          },
          members: membersWithDetails
        };
      })
    );

    console.log(`[Teams API] Successfully fetched ${teamsWithDetails.length} teams`);
    
    return NextResponse.json({
      success: true,
      teams: teamsWithDetails
    });
  } catch (error) {
    console.error('[Teams API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Teams API] POST request received');
    
    // Check authentication first
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      console.log('[Teams API] Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    
    if (!authData.authenticated || !authData.user) {
      console.log('[Teams API] User not authenticated');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // All authenticated users can create teams
    console.log(`[Teams API] User ${authData.user.id} (${authData.user.role}) creating team`);

    const body = await request.json();
    console.log('[Teams API] Request body:', body);
    
    const { 
      name, 
      description, 
      maxMembers, 
      ownerId, 
      eventId,
      tags, 
      lookingFor 
    } = body;

    // Validate required fields
    if (!name) {
      console.log('[Teams API] Missing name field');
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!ownerId) {
      console.log('[Teams API] Missing ownerId field');
      return NextResponse.json(
        { error: 'Missing required field: ownerId' },
        { status: 400 }
      );
    }

    if (!eventId) {
      console.log('[Teams API] Missing eventId field');
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Validate that the user exists
    const user = await User.findById(ownerId);

    if (!user) {
      console.log(`[Teams API] User not found: ${ownerId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate that the event exists
    const event = await Event.findById(eventId);

    if (!event) {
      console.log(`[Teams API] Event not found: ${eventId}`);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('[Teams API] Creating team with data:', {
      name,
      description,
      maxMembers,
      ownerId,
      eventId,
      tags,
      lookingFor
    });

    // Create the team
    const team = await Team.create({
      name,
      description,
      maxMembers: maxMembers || 10,
      ownerId,
      eventId,
      tags: tags || '',
      lookingFor: lookingFor || '',
      isActive: true
    });

    // Add owner as team member with "owner" role
    await TeamMember.create({
      teamId: team._id.toString(),
      userId: ownerId,
      role: 'owner',
      isActive: true
    });

    // Get populated team data
    const owner = await User.findById(ownerId);
    const ownerProfile = await Profile.findOne({ userId: ownerId });
    const eventData = await Event.findById(eventId);

    const teamWithDetails = {
      ...team.toObject(),
      id: team._id.toString(),
      owner: {
        ...owner?.toObject(),
        id: owner?._id.toString(),
        profile: ownerProfile
      },
      event: {
        ...eventData?.toObject(),
        id: eventData?._id.toString()
      }
    };

    console.log('[Teams API] Team created successfully:', team._id.toString());

    return NextResponse.json({
      success: true,
      team: teamWithDetails
    });
  } catch (error) {
    console.error('[Teams API] POST Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create team';
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A team with this name already exists';
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid user or event reference';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

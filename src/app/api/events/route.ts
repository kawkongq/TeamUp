import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const events = await Event.find({ isActive: true })
      .sort({ startDate: 1 })
      .lean();

    // Get teams for each event with populated data
    const eventsWithTeams = await Promise.all(
      events.map(async (event) => {
        const teams = await Team.find({ eventId: event._id.toString() })
          .lean();

        const teamsWithDetails = await Promise.all(
          teams.map(async (team) => {
            const owner = await User.findById(team.ownerId).lean();
            const ownerProfile = owner ? await Profile.findOne({ userId: owner._id.toString() }).lean() : null;
            
            const members = await TeamMember.find({ teamId: team._id.toString(), isActive: true }).lean();
            const membersWithDetails = await Promise.all(
              members.map(async (member) => {
                const user = await User.findById(member.userId).lean();
                const profile = user ? await Profile.findOne({ userId: user._id.toString() }).lean() : null;
                return {
                  ...member,
                  user: {
                    ...user,
                    profile
                  }
                };
              })
            );

            return {
              ...team,
              owner: {
                ...owner,
                profile: ownerProfile
              },
              members: membersWithDetails
            };
          })
        );

        return {
          ...event,
          id: event._id.toString(),
          teams: teamsWithDetails
        };
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithTeams
    });
  } catch (error) {
    console.error('Events GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
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

    // Check if user has permission to create events
    const userRole = authData.user.role;
    if (userRole !== 'organizer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Only organizers and admins can create events.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      location, 
      imageUrl,
      type,
      category,
      tags,
      maxTeams
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    const eventData: any = {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      imageUrl,
      type,
      category,
      tags,
      maxTeams,
      isActive: true
    };

    await connectDB();
    
    const event = await Event.create(eventData);
    return NextResponse.json({
      success: true,
      event: {
        id: event._id.toString(),
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        imageUrl: event.imageUrl,
        type: event.type,
        category: event.category,
        tags: event.tags,
        maxTeams: event.maxTeams,
        isActive: event.isActive
      }
    });

  } catch (error) {
    console.error('Events POST Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create event';
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'An event with this name already exists';
      } else if (error.message.includes('Required')) {
        errorMessage = 'Missing required fields';
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

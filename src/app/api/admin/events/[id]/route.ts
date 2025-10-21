import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';
import EventRegistration from '@/models/EventRegistration';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findById(id).lean();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get teams registered for this event
    const eventRegistrations = await EventRegistration.find({ eventId: id }).lean();
    const teamIds = eventRegistrations.map(reg => reg.teamId);
    
    const teams = await Team.find({ _id: { $in: teamIds } })
      .populate('ownerId', '_id name email')
      .lean();

    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await TeamMember.countDocuments({ 
          teamId: team._id, 
          isActive: true 
        });
        const ownerProfile = await Profile.findOne({ 
          userId: team.ownerId._id.toString() 
        }).lean();

        return {
          id: team._id.toString(),
          name: team.name,
          description: team.description,
          memberCount,
          maxMembers: team.maxMembers,
          isActive: team.isActive !== false,
          createdAt: team.createdAt.toISOString(),
          owner: {
            id: team.ownerId._id.toString(),
            name: team.ownerId.name || team.ownerId.email,
            email: team.ownerId.email,
            avatar: ownerProfile?.avatar
          }
        };
      })
    );

    const eventDetails = {
      id: event._id.toString(),
      name: event.name,
      description: event.description || '',
      type: event.type,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.location || 'Not specified',
      maxTeams: event.maxTeams,
      isActive: event.isActive !== false,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      teams: teamsWithDetails,
      teamCount: teamsWithDetails.length,
      totalParticipants: teamsWithDetails.reduce((sum, team) => sum + team.memberCount, 0)
    };

    return NextResponse.json({ event: eventDetails });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch event details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Delete all event registrations for this event
    await EventRegistration.deleteMany({ eventId: id });

    // Finally, delete the event
    await Event.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ 
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, type, startDate, endDate, location, maxTeams, isActive } = body;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        name,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        maxTeams,
        isActive
      },
      { new: true }
    ).lean();

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const participantCount = await EventRegistration.countDocuments({ eventId: id });

    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully',
      event: {
        id: updatedEvent._id.toString(),
        title: updatedEvent.name,
        description: updatedEvent.description || '',
        startDate: updatedEvent.startDate.toISOString(),
        endDate: updatedEvent.endDate.toISOString(),
        location: updatedEvent.location || 'Not specified',
        participantCount,
        maxParticipants: updatedEvent.maxTeams || 0,
        createdBy: 'System',
        createdAt: updatedEvent.createdAt.toISOString(),
        isActive: updatedEvent.isActive
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ 
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


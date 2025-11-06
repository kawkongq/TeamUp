// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .lean();

    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const participantCount = await EventRegistration.countDocuments({ 
          eventId: event._id 
        });

        return {
          id: event._id.toString(),
          title: event.name,
          description: event.description || '',
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          location: event.location || 'Not specified',
          participantCount,
          maxParticipants: event.maxTeams || 0,
          createdBy: 'System', // Since there's no creator field
          createdAt: event.createdAt.toISOString(),
          isActive: event.isActive !== false
        };
      })
    );

    return NextResponse.json({ 
      events: formattedEvents,
      total: formattedEvents.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, type, startDate, endDate, location, maxTeams } = body;

    const newEvent = new Event({
      name,
      description: description || '',
      type: type || 'hackathon',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || '',
      maxTeams: maxTeams || null,
      isActive: true
    });

    await newEvent.save();

    return NextResponse.json({ 
      success: true,
      message: 'Event created successfully',
      event: {
        id: newEvent._id.toString(),
        title: newEvent.name,
        description: newEvent.description || '',
        startDate: newEvent.startDate.toISOString(),
        endDate: newEvent.endDate.toISOString(),
        location: newEvent.location || 'Not specified',
        participantCount: 0,
        maxParticipants: newEvent.maxTeams || 0,
        createdBy: 'System',
        createdAt: newEvent.createdAt.toISOString(),
        isActive: newEvent.isActive
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ 
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

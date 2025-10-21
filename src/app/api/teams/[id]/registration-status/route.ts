import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }
    
    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!authResponse.ok) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        requiresAuth: true
      });
    }

    const authData = await authResponse.json();
    
    if (!authData.authenticated || !authData.user) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        requiresAuth: true
      });
    }

    // Check if team is registered for this event
    const registration = await EventRegistration.findOne({
      eventId,
      teamId
    }).lean();

    return NextResponse.json({
      success: true,
      isRegistered: !!registration,
      requiresAuth: false,
      registration: registration ? {
        id: registration._id.toString(),
        status: registration.status || 'registered',
        createdAt: registration.createdAt
      } : null
    });

  } catch (error) {
    console.error('Check team registration status error:', error);
    return NextResponse.json(
      { error: 'Failed to check team registration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
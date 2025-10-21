import { NextRequest, NextResponse } from 'next/server';
// MongoDB migration: This API needs to be updated to use Mongoose
// import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const eventId = params.id;

    const timeline = await prisma.eventTimeline.findMany({
      where: { eventId },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({
      success: true,
      timeline
    });

  } catch (error) {
    console.error('Event timeline GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const eventId = params.id;
    console.log('[Timeline API] Starting timeline creation for event:', eventId);
    
    // Check authentication
    const cookies = request.headers.get('cookie') || '';
    console.log('[Timeline API] Cookies present:', !!cookies);
    
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/check`, {
      headers: {
        cookie: cookies,
      },
    });
    
    console.log('[Timeline API] Auth response status:', authResponse.status);

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

    // Check if user can manage this event (organizer or admin)
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const userRole = authData.user.role;
    if (userRole !== 'organizer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Only organizers and admins can manage event timeline.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    const timelineItem = await prisma.eventTimeline.create({
      data: {
        eventId,
        title,
        description,
        date: new Date(date),
        isCompleted: false
      }
    });

    return NextResponse.json({
      success: true,
      timelineItem
    });

  } catch (error) {
    console.error('Event timeline POST error:', error);
    
    let errorMessage = 'Failed to create timeline item';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Detailed error:', error.message);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
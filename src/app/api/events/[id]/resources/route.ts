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

    const resources = await prisma.eventResource.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      resources
    });

  } catch (error) {
    console.error('Event resources GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
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
        { error: 'Access denied. Only organizers and admins can manage event resources.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, type, url, fileUrl } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    if (type === 'LINK' && !url) {
      return NextResponse.json(
        { error: 'URL is required for link resources' },
        { status: 400 }
      );
    }

    if (type === 'FILE' && !fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required for file resources' },
        { status: 400 }
      );
    }

    const resource = await prisma.eventResource.create({
      data: {
        eventId,
        title,
        description,
        type,
        url: type === 'LINK' ? url : null,
        fileUrl: type === 'FILE' ? fileUrl : null
      }
    });

    return NextResponse.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error('Event resources POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
// MongoDB migration: This API needs to be updated to use Mongoose
// import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; timelineId: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const { id: eventId, timelineId } = params;
    
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

    // Check permissions
    const userRole = authData.user.role;
    if (userRole !== 'organizer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date, isCompleted } = body;

    const timelineItem = await prisma.eventTimeline.update({
      where: { id: timelineId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(isCompleted !== undefined && { isCompleted })
      }
    });

    return NextResponse.json({
      success: true,
      timelineItem
    });

  } catch (error) {
    console.error('Event timeline PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; timelineId: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const { timelineId } = params;
    
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

    // Check permissions
    const userRole = authData.user.role;
    if (userRole !== 'organizer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await prisma.eventTimeline.delete({
      where: { id: timelineId }
    });

    return NextResponse.json({
      success: true,
      message: 'Timeline item deleted successfully'
    });

  } catch (error) {
    console.error('Event timeline DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete timeline item' },
      { status: 500 }
    );
  }
}
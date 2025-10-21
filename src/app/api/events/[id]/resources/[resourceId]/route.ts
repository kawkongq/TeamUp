import { NextRequest, NextResponse } from 'next/server';
// MongoDB migration: This API needs to be updated to use Mongoose
// import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; resourceId: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const { resourceId } = params;
    
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
    const { title, description, type, url, fileUrl } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

    const resource = await prisma.eventResource.update({
      where: { id: resourceId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error('Event resource PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; resourceId: string } }
) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during MongoDB migration' },
    { status: 503 }
  );
  try {
    const { resourceId } = params;
    
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

    await prisma.eventResource.delete({
      where: { id: resourceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Event resource DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
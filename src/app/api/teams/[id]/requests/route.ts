import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import JoinRequest from '@/models/JoinRequest';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

// GET /api/teams/[id]/requests - Get join requests for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Verify that the user is the team owner
    const team = await Team.findById(teamId).lean();

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'Only team owners can view join requests' },
        { status: 403 }
      );
    }

    // Get join requests for the team
    const requests = await JoinRequest.find({ teamId })
      .sort({ createdAt: -1 })
      .lean();

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const user = await User.findById(request.userId).lean();
        const profile = await Profile.findOne({ userId: request.userId }).lean();

        return {
          id: request._id.toString(),
          teamId: request.teamId,
          userId: request.userId,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt,
          user: {
            id: user?._id.toString(),
            name: user?.name,
            email: user?.email,
            profile: profile ? {
              displayName: profile.displayName,
              avatar: profile.avatar,
              role: profile.role
            } : null
          }
        };
      })
    );

    return NextResponse.json({ requests: requestsWithUsers });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/requests - Process join request (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: teamId } = await params;
    const { requestId, action, ownerId } = await request.json();

    if (!requestId || !action || !ownerId) {
      return NextResponse.json(
        { error: 'Request ID, action, and owner ID are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || 
        !mongoose.Types.ObjectId.isValid(requestId) || 
        !mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Verify that the user is the team owner
    const team = await Team.findById(teamId).lean();

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.ownerId !== ownerId) {
      return NextResponse.json(
        { error: 'Only team owners can process join requests' },
        { status: 403 }
      );
    }

    // Get the join request
    const joinRequest = await JoinRequest.findById(requestId).lean();

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    if (joinRequest.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Join request does not belong to this team' },
        { status: 400 }
      );
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Join request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Check if team is full
      const memberCount = await TeamMember.countDocuments({ teamId, isActive: true });
      if (memberCount >= team.maxMembers) {
        return NextResponse.json(
          { error: 'Team is already full' },
          { status: 400 }
        );
      }

      // Check if user is already a member
      const existingMember = await TeamMember.findOne({
        teamId,
        userId: joinRequest.userId,
        isActive: true
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this team' },
          { status: 400 }
        );
      }

      // Use MongoDB session for transaction
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Update join request status
          await JoinRequest.findByIdAndUpdate(
            requestId,
            { status: 'approved' },
            { session }
          );

          // Add user as team member
          await TeamMember.create([{
            teamId,
            userId: joinRequest.userId,
            role: 'member',
            isActive: true,
            joinedAt: new Date()
          }], { session });
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Join request approved and user added to team' 
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Reject the request
      await JoinRequest.findByIdAndUpdate(requestId, {
        status: 'rejected'
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Join request rejected' 
      });
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
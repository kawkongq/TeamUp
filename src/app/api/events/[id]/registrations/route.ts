import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is organizer or admin
    if (authData.user.role !== 'organizer' && authData.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Get event registrations (teams)
    const registrations = await EventRegistration.find({ eventId })
      .sort({ createdAt: -1 })
      .lean();

    const registrationsWithDetails = await Promise.all(
      registrations.map(async (registration) => {
        const team = await Team.findById(registration.teamId);
        const owner = team ? await User.findById(team.ownerId) : null;
        const ownerProfile = owner ? await Profile.findOne({ userId: owner._id.toString() }) : null;
        
        const members = team ? await TeamMember.find({ teamId: team._id.toString(), isActive: true }) : [];
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = await User.findById(member.userId);
            const profile = user ? await Profile.findOne({ userId: user._id.toString() }) : null;
            return {
              ...member,
              id: member._id.toString(),
              user: {
                ...user?.toObject(),
                id: user?._id.toString(),
                profile
              }
            };
          })
        );

        return {
          ...registration,
          id: registration._id.toString(),
          team: {
            ...team?.toObject(),
            id: team?._id.toString(),
            owner: {
              ...owner?.toObject(),
              id: owner?._id.toString(),
              profile: ownerProfile
            },
            members: membersWithDetails
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      registrations: registrationsWithDetails
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to get registrations' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: userId } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is deleted
    if (user.name?.startsWith('[DELETED]')) {
      return NextResponse.json({ error: 'User has been deleted' }, { status: 404 });
    }

    // Get user profile
    const profile = await Profile.findOne({ userId: userId }).lean();
    
    // Get owned teams
    const ownedTeams = await Team.find({ ownerId: userId }).lean();
    
    // Get team memberships
    const teamMemberships = await TeamMember.find({ userId: userId, isActive: true })
      .populate('teamId', 'name description createdAt')
      .lean();

    const userProfile = {
      id: user._id.toString(),
      name: user.name || user.email,
      email: user.email,
      role: user.role || 'user',
      status: 'active',
      avatar: profile?.avatar,
      bio: profile?.bio || 'No bio available',
      location: profile?.location || 'Not specified',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      experience: profile?.experience || 'Not specified',
      github: profile?.github,
      linkedin: profile?.linkedin,
      timezone: profile?.timezone,
      hourlyRate: profile?.hourlyRate,
      rating: profile?.rating || 0,
      projectsCompleted: profile?.projectsCompleted || 0,
      createdAt: user.createdAt.toISOString(),
      ownedTeams: ownedTeams.map(team => ({
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        memberCount: 0, // We'll need to count separately if needed
        createdAt: team.createdAt.toISOString()
      })),
      teamMemberships: teamMemberships.map(member => ({
        id: member.teamId._id.toString(),
        name: member.teamId.name,
        description: member.teamId.description,
        joinedAt: member.joinedAt.toISOString(),
        role: member.role
      })),
      eventParticipations: [] // No direct event participation in current schema
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
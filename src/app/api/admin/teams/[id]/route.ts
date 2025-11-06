// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import Profile from '@/models/Profile';
import TeamMember from '@/models/TeamMember';
import Event from '@/models/Event';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  context: any,
) {
  const { params } = context as { params: { id: string } };
  try {
    await connectDB();
    const teamId = params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const team = await Team.findById(teamId).lean();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get owner details
    const owner = await User.findById(team.ownerId).lean();
    const ownerProfile = owner ? await Profile.findOne({ userId: owner._id.toString() }).lean() : null;

    // Get event details if team has an event
    const event = team.eventId ? await Event.findById(team.eventId).lean() : null;

    // Get team members
    const members = await TeamMember.find({ teamId: teamId, isActive: true })
      .populate('userId', '_id name email')
      .lean();

    // Get member profiles
    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const profile = await Profile.findOne({ userId: member.userId._id.toString() }).lean();
        return {
          id: member._id.toString(),
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          isActive: member.isActive,
          user: {
            id: member.userId._id.toString(),
            name: member.userId.name || member.userId.email,
            email: member.userId.email,
            avatar: profile?.avatar,
            role: profile?.role,
            location: profile?.location
          }
        };
      })
    );

    const teamDetails = {
      id: team._id.toString(),
      name: team.name,
      description: team.description,
      maxMembers: team.maxMembers,
      tags: team.tags || [],
      lookingFor: team.lookingFor || [],
      isActive: team.isActive !== false,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      owner: owner ? {
        id: owner._id.toString(),
        name: owner.name || owner.email,
        email: owner.email,
        avatar: ownerProfile?.avatar
      } : null,
      event: event ? {
        id: event._id.toString(),
        name: event.name,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        location: event.location
      } : null,
      members: membersWithProfiles,
      joinRequests: [], // Join requests not implemented in current schema
      memberCount: membersWithProfiles.length,
      pendingRequests: 0
    };

    return NextResponse.json({ team: teamDetails });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any,
) {
  const { params } = context as { params: { id: string } };
  try {
    await connectDB();
    const teamId = params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    // First, delete all team members
    await TeamMember.deleteMany({ teamId: teamId });

    // Finally, delete the team
    await Team.findByIdAndDelete(teamId);

    return NextResponse.json({ 
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ 
      error: 'Failed to delete team',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: any,
) {
  const { params } = context as { params: { id: string } };
  try {
    await connectDB();
    const teamId = params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, maxMembers, tags, lookingFor, isActive } = body;

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      {
        name,
        description,
        maxMembers,
        tags,
        lookingFor,
        isActive
      },
      { new: true }
    ).lean();

    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get owner details
    const owner = await User.findById(updatedTeam.ownerId).lean();
    const memberCount = await TeamMember.countDocuments({ teamId: teamId, isActive: true });

    return NextResponse.json({ 
      success: true,
      message: 'Team updated successfully',
      team: {
        id: updatedTeam._id.toString(),
        name: updatedTeam.name,
        description: updatedTeam.description,
        memberCount,
        maxMembers: updatedTeam.maxMembers,
        createdBy: owner?.name || owner?.email || 'Unknown',
        createdAt: updatedTeam.createdAt.toISOString(),
        isActive: updatedTeam.isActive
      }
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ 
      error: 'Failed to update team',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

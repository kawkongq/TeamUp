import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import Event from '@/models/Event';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // For now, we'll fetch general stats. In a real app, you'd get the user ID from the session
    const userId = request.nextUrl.searchParams.get('userId');

    // Get total users count
    const totalUsers = await User.countDocuments({ name: { $not: /^\[DELETED\]/ } });
    
    // Get total teams count
    const totalTeams = await Team.countDocuments();
    
    // Get total events count
    const totalEvents = await Event.countDocuments();

    // Get user profile if userId is provided
    let userProfile = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userProfile = await Profile.findOne({ userId }).lean();
    }

    // Get recent teams
    const recentTeams = await Team.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent events
    const recentEvents = await Event.find({
      startDate: { $gte: new Date() },
      isActive: { $ne: false }
    })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

    // Get user data
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
    }

    // Calculate stats
    const stats = {
      totalProjects: totalTeams,
      completedProjects: Math.floor(totalTeams * 0.7), // Mock data
      totalEarnings: 0, // Mock data
      averageRating: 4.5 // Mock data
    };

    // Format recent teams for display
    const formattedTeams = recentTeams.map(team => ({
      id: team._id.toString(),
      name: team.name,
      description: team.description || 'No description available',
      status: team.isActive !== false ? 'Active' : 'Inactive',
      createdAt: team.createdAt
    }));

    // Format recent events for display
    const formattedEvents = recentEvents.map(event => ({
      id: event._id.toString(),
      name: event.name,
      description: event.description || 'No description available',
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || 'Online'
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: user ? {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profile: userProfile
        } : null,
        stats,
        recentTeams: formattedTeams,
        recentEvents: formattedEvents
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

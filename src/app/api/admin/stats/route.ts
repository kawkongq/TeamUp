import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import Event from '@/models/Event';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const [
      totalUsers,
      totalTeams,
      totalEvents,
      recentUsers,
      recentTeams,
      recentEvents
    ] = await Promise.all([
      User.countDocuments({
        name: { $not: /^\[DELETED\]/ }
      }),
      Team.countDocuments(),
      Event.countDocuments(),
      User.find({
        name: { $not: /^\[DELETED\]/ }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id name email createdAt')
        .lean(),
      Team.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id name createdAt')
        .lean(),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id name createdAt')
        .lean()
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers: totalUsers, // All users are considered active
        inactiveUsers: 0,
        totalTeams,
        totalEvents
      },
      recent: {
        users: recentUsers.map(user => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        })),
        teams: recentTeams.map(team => ({
          id: team._id.toString(),
          name: team.name,
          createdAt: team.createdAt
        })),
        events: recentEvents.map(event => ({
          id: event._id.toString(),
          name: event.name,
          createdAt: event.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
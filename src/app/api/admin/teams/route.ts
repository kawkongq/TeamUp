import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const teams = await Team.find()
      .populate('ownerId', '_id name email')
      .sort({ createdAt: -1 })
      .lean();

    const formattedTeams = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await TeamMember.countDocuments({ 
          teamId: team._id, 
          isActive: true 
        });

        return {
          id: team._id.toString(),
          name: team.name,
          description: team.description,
          memberCount,
          maxMembers: team.maxMembers,
          createdBy: team.ownerId?.name || team.ownerId?.email || 'Unknown',
          createdAt: team.createdAt.toISOString(),
          isActive: team.isActive !== false
        };
      })
    );

    return NextResponse.json({ 
      teams: formattedTeams,
      total: formattedTeams.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
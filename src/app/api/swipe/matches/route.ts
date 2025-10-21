import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Swipe from '@/models/Swipe';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get users that the current user hasn't swiped on yet
    const swipedUserIds = await Swipe.find({ swiperId: userId }).distinct('swipeeId');
    
    // Get potential matches (users with profiles, excluding self and already swiped)
    const potentialMatches = await User.find({
      _id: { $nin: [userId, ...swipedUserIds] }, // Not the current user and not already swiped
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get profiles for these users
    const usersWithProfiles = await Promise.all(
      potentialMatches.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id.toString() }).lean();
        
        if (!profile || !profile.isAvailable) {
          return null; // Skip users without profiles or who are not available
        }

        return {
          id: user._id.toString(),
          name: profile.displayName || user.name || 'Anonymous',
          role: profile.role || 'No role specified',
          avatar: profile.avatar || null,
          location: profile.location || 'Location not specified',
          skills: profile.skills || [],
          experience: profile.experience || 'Experience not specified',
          interests: profile.interests || [],
          status: profile.isAvailable ? 'available' : 'unavailable',
          bio: profile.bio || 'No bio available',
          github: profile.links?.github || null,
          linkedin: profile.links?.linkedin || null,
          rating: profile.rating || 0,
          projectsCompleted: profile.projectsCompleted || 0,
          hourlyRate: profile.hourlyRate || null,
          timezone: profile.timezone || null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        };
      })
    );

    // Filter out null values (users without profiles or not available)
    const people = usersWithProfiles.filter(user => user !== null);

    return NextResponse.json({
      success: true,
      people: people,
      count: people.length
    });

  } catch (error) {
    console.error('Matches API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch potential matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Fetch users who are not deleted
    const users: any[] = await User.find({
      name: { $not: /^\[DELETED\]/ }
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    // Get profiles for these users
    const usersWithProfiles = await Promise.all(
      users.map(async (user: any) => {
        const profile: any = await Profile.findOne({ userId: user._id.toString() }).lean();
        
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
          github: (profile as any).links?.github || (profile as any).github || null,
          linkedin: (profile as any).links?.linkedin || (profile as any).linkedin || null,
          portfolio: (profile as any).links?.portfolio || null,
          rating: profile.rating || 0,
          projectsCompleted: profile.projectsCompleted || 0,
          hourlyRate: profile.hourlyRate,
          timezone: profile.timezone,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        };
      })
    );

    // Filter out null values (users without profiles or not available)
    const people = usersWithProfiles.filter(user => user !== null);

    return NextResponse.json({
      success: true,
      people: people
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

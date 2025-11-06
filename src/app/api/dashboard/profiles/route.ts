import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { toSanitizedId } from '@/lib/team-response';

type SanitizedProfile = {
  id: string;
  displayName?: string;
  bio?: string;
  role?: string;
  timezone?: string;
  userId?: string;
};

function mapProfile(profileDoc: unknown): SanitizedProfile | null {
  if (!profileDoc || typeof profileDoc !== 'object') {
    return null;
  }

  const record = profileDoc as Record<string, unknown>;
  const id = toSanitizedId(record._id ?? record.id);
  if (!id) {
    return null;
  }

  return {
    id,
    displayName: typeof record.displayName === 'string' ? record.displayName : undefined,
    bio: typeof record.bio === 'string' ? record.bio : undefined,
    role: typeof record.role === 'string' ? record.role : undefined,
    timezone: typeof record.timezone === 'string' ? record.timezone : undefined,
    userId: typeof record.userId === 'string' ? record.userId : undefined,
  };
}

export async function GET() {
  try {
    await connectDB();
    
    try {
      const profiles = await Profile.find()
        .sort({ _id: 1 })
        .lean();

      const transformedProfiles = profiles
        .map((profile) => mapProfile(profile))
        .filter((profile): profile is SanitizedProfile => profile !== null);

      return NextResponse.json({ profiles: transformedProfiles });
    } catch (dbError) {
      console.error("Database error, using mock data:", dbError);
      
      // Fallback to mock data if database fails
      const mockProfiles = [
        {
          id: "profile1",
          displayName: "Admin User",
          bio: "System Administrator with full access to the platform",
          role: "Admin",
          timezone: "UTC",
          userId: "test123",
        },
        {
          id: "profile2",
          displayName: "Test User",
          bio: "Test user for development and testing purposes",
          role: "User",
          timezone: "America/New_York",
          userId: "cmf1dd7va000048svr3jywbof",
        },
        {
          id: "profile4",
          displayName: "Sarah Chen",
          bio: "MIT Computer Science student passionate about AI and machine learning",
          role: "Student",
          timezone: "America/New_York",
          userId: "sarah123",
        },
        {
          id: "profile5",
          displayName: "David Kim",
          bio: "UC Berkeley student studying software engineering and web development",
          role: "Student",
          timezone: "America/Los_Angeles",
          userId: "david123",
        },
        {
          id: "profile6",
          displayName: "Emma Thompson",
          bio: "Harvard student interested in entrepreneurship and innovation",
          role: "Student",
          timezone: "America/New_York",
          userId: "emma123",
        },
        {
          id: "profile7",
          displayName: "James Wilson",
          bio: "CMU student focused on cybersecurity and network security",
          role: "Student",
          timezone: "America/New_York",
          userId: "james123",
        },
      ];

      return NextResponse.json({
        profiles: mockProfiles,
        note: "Using mock data - database connection failed"
      });
    }
    
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json({
      error: "Failed to fetch profiles",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

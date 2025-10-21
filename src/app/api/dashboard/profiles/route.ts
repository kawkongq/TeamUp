import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET() {
  try {
    await connectDB();
    
    // Try to fetch real data from database
    try {
      const profiles = await Profile.find()
        .sort({ _id: 1 })
        .lean();

      console.log(`Fetched ${profiles.length} profiles from database`);
      
      const transformedProfiles = profiles.map(profile => ({
        id: profile._id.toString(),
        displayName: profile.displayName,
        bio: profile.bio,
        role: profile.role,
        timezone: profile.timezone,
        userId: profile.userId,
      }));
      
      console.log('Transformed profiles data:', JSON.stringify(transformedProfiles, null, 2));

      return NextResponse.json({
        profiles: transformedProfiles,
      });
      
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

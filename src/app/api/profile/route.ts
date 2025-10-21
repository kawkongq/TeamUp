
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import Skill from '@/models/Skill';
import Interest from '@/models/Interest';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user ID from session or query params
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = await Profile.findOne({ userId }).lean();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get skill and interest details
    const skillsWithDetails = await Promise.all(
      (profile.skills || []).map(async (skill) => {
        const skillDetail = await Skill.findById(skill.skillId).lean();
        return {
          ...skill,
          skill: skillDetail
        };
      })
    );

    const interestsWithDetails = await Promise.all(
      (profile.interests || []).map(async (interest) => {
        const interestDetail = await Interest.findById(interest.interestId).lean();
        return {
          ...interest,
          interest: interestDetail
        };
      })
    );

    const profileWithDetails = {
      ...profile,
      id: profile._id.toString(),
      skills: skillsWithDetails,
      interests: interestsWithDetails
    };

    return NextResponse.json({ profile: profileWithDetails });
  } catch (error) {
    console.error('Profile GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, skills, interests, ...profileData } = body;

    console.log('Profile API received:', { userId, profileData, skills, interests });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update profile with skills and interests
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      {
        displayName: profileData.displayName,
        bio: profileData.bio,
        role: profileData.role,
        location: profileData.location,
        experience: profileData.experience,
        availability: profileData.availability,
        timezone: profileData.timezone,
        links: profileData.links,
        isAvailable: profileData.isAvailable,
        avatar: profileData.avatar,
        skills: skills || [],
        interests: interests || []
      },
      { new: true, upsert: true }
    );

    console.log('Profile updated in database:', updatedProfile);

    // Get skill and interest details for response
    const skillsWithDetails = await Promise.all(
      (updatedProfile.skills || []).map(async (skill) => {
        const skillDetail = await Skill.findById(skill.skillId).lean();
        return {
          ...skill,
          skill: skillDetail
        };
      })
    );

    const interestsWithDetails = await Promise.all(
      (updatedProfile.interests || []).map(async (interest) => {
        const interestDetail = await Interest.findById(interest.interestId).lean();
        return {
          ...interest,
          interest: interestDetail
        };
      })
    );

    const profileWithDetails = {
      ...updatedProfile.toObject(),
      id: updatedProfile._id.toString(),
      skills: skillsWithDetails,
      interests: interestsWithDetails
    };

    return NextResponse.json({ 
      success: true, 
      profile: profileWithDetails,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

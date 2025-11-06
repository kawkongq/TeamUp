// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';

export async function GET() {
  try {
    await connectDB();
    
    const skills = await Skill.find({})
      .sort({ name: 1 })
      .lean();

    const skillsWithId = skills.map(skill => ({
      ...skill,
      id: skill._id.toString()
    }));

    return NextResponse.json({
      success: true,
      skills: skillsWithId
    });
  } catch (error) {
    console.error('Skills GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, category } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    const skill = await Skill.create({
      name,
      category: category || 'Other'
    });

    return NextResponse.json({
      success: true,
      skill: {
        ...skill.toObject(),
        id: skill._id.toString()
      }
    });
  } catch (error) {
    console.error('Skills POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}

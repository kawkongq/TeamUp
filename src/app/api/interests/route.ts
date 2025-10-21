import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Interest from '@/models/Interest';

export async function GET() {
  try {
    await connectDB();
    
    const interests = await Interest.find({})
      .sort({ name: 1 })
      .lean();

    const interestsWithId = interests.map(interest => ({
      ...interest,
      id: interest._id.toString()
    }));

    return NextResponse.json({
      success: true,
      interests: interestsWithId
    });
  } catch (error) {
    console.error('Interests GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
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
        { error: 'Interest name is required' },
        { status: 400 }
      );
    }

    const interest = await Interest.create({
      name,
      category: category || 'Other'
    });

    return NextResponse.json({
      success: true,
      interest: {
        ...interest.toObject(),
        id: interest._id.toString()
      }
    });
  } catch (error) {
    console.error('Interests POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create interest' },
      { status: 500 }
    );
  }
}

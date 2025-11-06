import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Interest from '@/models/Interest';
import { toSanitizedId } from '@/lib/team-response';

type InterestRecord = {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  category?: unknown;
};

type CreateInterestPayload = {
  name?: unknown;
  category?: unknown;
};

export async function GET() {
  try {
    await connectDB();
    
    const interests = await Interest.find({})
      .sort({ name: 1 })
      .lean<InterestRecord[]>();

    const interestsWithId = interests.map((interest) => {
      const id = toSanitizedId(interest._id ?? interest.id);
      return {
        id,
        name: typeof interest.name === 'string' ? interest.name : '',
        category: typeof interest.category === 'string' ? interest.category : 'Other',
      };
    });

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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = (await request.json()) as CreateInterestPayload;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const category =
      typeof body.category === 'string' && body.category.trim().length > 0
        ? body.category.trim()
        : 'Other';

    if (!name) {
      return NextResponse.json(
        { error: 'Interest name is required' },
        { status: 400 }
      );
    }

    const interest = await Interest.create({
      name,
      category
    });

    return NextResponse.json({
      success: true,
      interest: {
        id: toSanitizedId(interest._id) || interest._id.toString(),
        name: interest.name,
        category: interest.category
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

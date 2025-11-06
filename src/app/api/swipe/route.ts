import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import Swipe from '@/models/Swipe';

type SwipePayload = {
  userId?: unknown;
  targetUserId?: unknown;
  action?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = (await request.json()) as SwipePayload;
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';
    const action = typeof body.action === 'string' ? body.action.toLowerCase() : '';

    if (!userId || !targetUserId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, targetUserId, action' },
        { status: 400 }
      );
    }

    if (!['like', 'pass'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "like" or "pass"' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    const direction = action === 'like' ? 'LIKE' : 'PASS';

    const existingSwipe = await Swipe.findOne({
      swiperId: userId,
      swipeeId: targetUserId
    });

    if (existingSwipe) {
      await Swipe.findByIdAndUpdate(existingSwipe._id, { direction });
    } else {
      const swipe = new Swipe({
        swiperId: userId,
        swipeeId: targetUserId,
        direction
      });
      await swipe.save();
    }

    if (action === 'like') {
      const mutualSwipe = await Swipe.findOne({
        swiperId: targetUserId,
        swipeeId: userId,
        direction: 'LIKE'
      });

      if (mutualSwipe) {
        const existingMatch = await Match.findOne({
          $or: [
            { userAId: userId, userBId: targetUserId },
            { userAId: targetUserId, userBId: userId }
          ]
        });

        if (!existingMatch) {
          const match = new Match({
            userAId: userId,
            userBId: targetUserId,
            isActive: true
          });
          await match.save();

          return NextResponse.json({
            success: true,
            action,
            match: true,
            matchId: match._id.toString()
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      action,
      match: false
    });

  } catch (error) {
    console.error('Swipe API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process swipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

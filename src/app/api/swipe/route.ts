import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Swipe from '@/models/Swipe';
import Match from '@/models/Match';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, targetUserId, action } = body;

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

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Map action to direction
    const direction = action === 'like' ? 'LIKE' : 'PASS';

    // Check if there's already a swipe
    const existingSwipe = await Swipe.findOne({
      swiperId: userId,
      swipeeId: targetUserId
    });

    if (existingSwipe) {
      // Update existing swipe
      await Swipe.findByIdAndUpdate(existingSwipe._id, { direction });
    } else {
      // Create new swipe
      const swipe = new Swipe({
        swiperId: userId,
        swipeeId: targetUserId,
        direction
      });
      await swipe.save();
    }

    // If this is a like, check for mutual match
    if (action === 'like') {
      const mutualSwipe = await Swipe.findOne({
        swiperId: targetUserId,
        swipeeId: userId,
        direction: 'LIKE'
      });

      if (mutualSwipe) {
        // Check if match already exists
        const existingMatch = await Match.findOne({
          $or: [
            { userAId: userId, userBId: targetUserId },
            { userAId: targetUserId, userBId: userId }
          ]
        });

        if (!existingMatch) {
          // Create a match
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

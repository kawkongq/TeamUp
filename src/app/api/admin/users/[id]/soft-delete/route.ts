import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Team from '@/models/Team';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  try {
    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Use MongoDB session for transaction-like behavior, with fallback if not supported
    let result: any = null;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await TeamMember.deleteMany({ userId }, { session });
        const ownedTeams = await Team.find({ ownerId: userId }, null, { session });
        for (const team of ownedTeams) {
          await TeamMember.deleteMany({ teamId: team._id.toString() }, { session });
          await Team.findByIdAndDelete(team._id, { session });
        }
        await Profile.deleteOne({ userId }, { session });
        await User.findByIdAndUpdate(
          userId,
          {
            name: `[DELETED] ${new Date().toISOString()}`,
            email: `deleted_${userId}@deleted.com`
          },
          { new: true, session }
        );
      });
      result = await User.findById(userId).lean();

      if (!result) {
        return NextResponse.json({ error: 'User not found after deletion' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'User and all related data have been successfully deleted',
        user: {
          id: result?._id.toString(),
          name: result?.name,
          email: result?.email
        }
      });
    } finally {
      await session.endSession();
    }
    
  } catch (error) {
    // Fallback path: if transactions are not supported (e.g., standalone MongoDB), perform best-effort deletes without session
    if (error instanceof Error && /Transaction numbers are only allowed/.test(error.message)) {
      try {
        // Best-effort deletes without session
        await TeamMember.deleteMany({ userId });
        const ownedTeams = await Team.find({ ownerId: userId });
        for (const team of ownedTeams) {
          await TeamMember.deleteMany({ teamId: team._id.toString() });
          await Team.findByIdAndDelete(team._id);
        }
        await Profile.deleteOne({ userId });
        const result = await User.findByIdAndUpdate(
          userId,
          {
            name: `[DELETED] ${new Date().toISOString()}`,
            email: `deleted_${userId}@deleted.com`
          },
          { new: true }
        );

        return NextResponse.json({
          success: true,
          message: 'User deleted without transaction (fallback mode)'
        });
      } catch (fallbackErr) {
        console.error('Fallback deletion failed:', fallbackErr);
        return NextResponse.json({
          error: 'Fallback deletion failed',
          details: fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    console.error('Error soft deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to delete user and related data',
      details: errorMessage
    }, { status: 500 });
  }
}
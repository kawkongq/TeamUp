// @ts-nocheck
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ??
  process.env.NEXT_PUBLIC_MONGODB_URI ??
  '';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI. Please set it in your environment variables.');
}

async function checkConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Connected!\n');
    console.log('📊 Connection Info:');
    console.log('   Database Name:', mongoose.connection.db?.databaseName ?? 'unknown');
    console.log('   Host:', mongoose.connection.host ?? 'unknown');
    console.log('   Port:', mongoose.connection.port ?? 'unknown');
    console.log('   Ready State:', mongoose.connection.readyState);
    
    // List all collections
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('   Database handle is not available. Skipping collection listing.');
      return;
    }

    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    collections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.name}`);
    });
    
    // Count documents in users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n👥 Total documents in 'users' collection: ${usersCount}`);
    
    // Get all users
    type RawUser = {
      _id: { toString(): string };
      email?: string;
      name?: string;
    };

    const users = await db
      .collection<RawUser>('users')
      .find({})
      .toArray();

    console.log('\n📋 Users in database:');
    users.forEach((user, i) => {
      console.log(
        `   ${i + 1}. ${user.email ?? 'unknown'} (${user.name ?? 'Unnamed'}) - ID: ${String(user._id)}`
      );
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkConnection();

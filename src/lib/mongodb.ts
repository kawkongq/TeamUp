import mongoose from 'mongoose';

import { debugLog } from './logger';

const databaseUri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!databaseUri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env or .env.local');
}

const MONGODB_URI = databaseUri;

// Validate that URI includes database name
if (!MONGODB_URI.includes('/teamup')) {
  console.error('❌ WARNING: MongoDB URI does not include /teamup database!');
  console.error('Current URI:', MONGODB_URI.replace(/:[^:@]*@/, ':***@'));
}

debugLog('MongoDB URI loaded:', MONGODB_URI ? 'Yes' : 'No');

const globalWithMongoose = global as typeof global & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached =
  globalWithMongoose.mongoose ??
  (globalWithMongoose.mongoose = { conn: null, promise: null });

async function connectDB() {
  // Check if already connected and connection is ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    debugLog('Using existing MongoDB connection');
    return cached.conn;
  }

  // If connection is in a bad state, reset it
  if (mongoose.connection.readyState === 3 || mongoose.connection.readyState === 0) {
    debugLog('Resetting MongoDB connection...');
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    };

    debugLog('Connecting to MongoDB...');
    debugLog('Database:', MONGODB_URI.split('/')[3]?.split('?')[0]);
    const startTime = Date.now();

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        const duration = Date.now() - startTime;
        debugLog(`✅ MongoDB connected successfully in ${duration}ms`);
        const dbName = mongooseInstance.connection.db?.databaseName ?? 'unknown';
        debugLog(`✅ Connected to database: ${dbName}`);
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error.message);
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

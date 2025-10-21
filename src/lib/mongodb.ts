import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env or .env.local');
}

// Validate that URI includes database name
if (!MONGODB_URI.includes('/teamup')) {
  console.error('❌ WARNING: MongoDB URI does not include /teamup database!');
  console.error('Current URI:', MONGODB_URI.replace(/:[^:@]*@/, ':***@'));
}

console.log('MongoDB URI loaded:', MONGODB_URI ? 'Yes' : 'No');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Check if already connected and connection is ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return cached.conn;
  }

  // If connection is in a bad state, reset it
  if (mongoose.connection.readyState === 3 || mongoose.connection.readyState === 0) {
    console.log('Resetting MongoDB connection...');
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
      w: 'majority',
    };

    console.log('Connecting to MongoDB...');
    console.log('Database:', MONGODB_URI.split('/')[3]?.split('?')[0]);
    const startTime = Date.now();
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      const duration = Date.now() - startTime;
      console.log(`✅ MongoDB connected successfully in ${duration}ms`);
      console.log(`✅ Connected to database: ${mongooseInstance.connection.db.databaseName}`);
      return mongooseInstance;
    }).catch((error) => {
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
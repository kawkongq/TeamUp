import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]*@/, ':***@')); // Hide password
    
    const start = Date.now();
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    const duration = Date.now() - start;
    console.log(`✅ Connected successfully in ${duration}ms`);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Fix suggestions:');
      console.log('1. Check username/password in MongoDB Atlas');
      console.log('2. Verify database user has correct permissions');
      console.log('3. Check if IP address is whitelisted');
    }
  }
}

testConnection();
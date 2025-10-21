import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";

async function checkConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Connected!\n');
    console.log('📊 Connection Info:');
    console.log('   Database Name:', mongoose.connection.db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('   Ready State:', mongoose.connection.readyState);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    collections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.name}`);
    });
    
    // Count documents in users collection
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\n👥 Total documents in 'users' collection: ${usersCount}`);
    
    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n📋 Users in database:');
    users.forEach((user: any, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.name}) - ID: ${user._id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkConnection();

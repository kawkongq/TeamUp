import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";
const USER_ID = '68f7328a5e70bf6d981435c0';

async function findUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Try to find by _id
    console.log(`🔍 Searching for user ID: ${USER_ID}`);
    const userById = await mongoose.connection.db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(USER_ID) 
    });
    
    if (userById) {
      console.log('✅ User FOUND by ID:');
      console.log(JSON.stringify(userById, null, 2));
    } else {
      console.log('❌ User NOT FOUND by ID');
    }
    
    // Try to find by email
    console.log(`\n🔍 Searching for email: test1761030793899@example.com`);
    const userByEmail = await mongoose.connection.db.collection('users').findOne({ 
      email: 'test1761030793899@example.com' 
    });
    
    if (userByEmail) {
      console.log('✅ User FOUND by email:');
      console.log(JSON.stringify(userByEmail, null, 2));
    } else {
      console.log('❌ User NOT FOUND by email');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUser();

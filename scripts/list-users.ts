// @ts-nocheck
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total users: ${users.length}\n`);
    console.log('👥 All users:');
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      const createdDate = new Date(user.createdAt).toLocaleString('th-TH');
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   Has Password: ${user.passwordHash ? '✅' : '❌'}`);
      console.log('─'.repeat(80));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();

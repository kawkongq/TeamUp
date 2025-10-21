import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";

// User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Profile schema
const ProfileSchema = new mongoose.Schema({
  userId: String,
  displayName: String,
  bio: String,
  role: String,
  timezone: String,
  isAvailable: Boolean,
  skills: [String],
  interests: [String],
}, { timestamps: true });

const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

async function testSignup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Test data
    const testEmail = `test${Date.now()}@example.com`;
    const testData = {
      email: testEmail,
      name: 'Test User',
      password: 'TestPassword123!',
      role: 'user'
    };

    console.log('📝 Creating test user:', testData.email);

    // Check if user exists
    const existingUser = await User.findOne({ email: testData.email });
    if (existingUser) {
      console.log('❌ User already exists');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    console.log('✅ Password hashed');

    // Create user
    console.log('👤 Creating user in database...');
    const user = await User.create({
      email: testData.email,
      name: testData.name,
      passwordHash: hashedPassword,
      role: testData.role
    });
    console.log('✅ User created:', {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Create profile
    console.log('📋 Creating profile...');
    const profile = await Profile.create({
      userId: user._id.toString(),
      displayName: testData.name,
      bio: '',
      role: testData.role,
      timezone: 'UTC',
      isAvailable: true,
      skills: [],
      interests: []
    });
    console.log('✅ Profile created:', {
      id: profile._id.toString(),
      userId: profile.userId,
      displayName: profile.displayName
    });

    // Verify user was saved
    console.log('\n🔍 Verifying user in database...');
    const savedUser = await User.findById(user._id);
    if (savedUser) {
      console.log('✅ User found in database!');
      console.log('   Email:', savedUser.email);
      console.log('   Name:', savedUser.name);
      console.log('   Has password:', !!savedUser.passwordHash);
    } else {
      console.log('❌ User NOT found in database!');
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log('\n📊 Total users in database:', totalUsers);

    // List all users
    const allUsers = await User.find({}, 'email name role').limit(10);
    console.log('\n👥 Recent users:');
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.name}) - ${u.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSignup();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://spacermick_db_user:admin123@cluster0.co4sjph.mongodb.net/teamup?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  password: String, // Old field
  role: String,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixUserPasswords() {
  try {
    await connectDB();
    
    // Find users with null passwordHash but have password field
    const users = await User.find({
      $or: [
        { passwordHash: { $exists: false } },
        { passwordHash: null },
        { passwordHash: "" }
      ]
    });
    
    console.log(`Found ${users.length} users with missing passwordHash`);
    
    for (const user of users) {
      console.log(`Fixing user: ${user.email}`);
      
      // If user has old password field, migrate it
      if (user.password) {
        // If password is already hashed (starts with $2), use it directly
        if (user.password.startsWith('$2')) {
          user.passwordHash = user.password;
        } else {
          // Hash the plain text password
          user.passwordHash = await bcrypt.hash(user.password, 10);
        }
      } else {
        // Set a default password (user will need to reset)
        const defaultPassword = 'TempPassword123!';
        user.passwordHash = await bcrypt.hash(defaultPassword, 10);
        console.log(`Set default password for ${user.email}: ${defaultPassword}`);
      }
      
      // Remove old password field
      user.password = undefined;
      
      await user.save();
      console.log(`Fixed user: ${user.email}`);
    }
    
    console.log('Password migration completed!');
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixUserPasswords();
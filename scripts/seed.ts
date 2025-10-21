import dotenv from 'dotenv';
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

import connectDB from '../src/lib/mongodb';
import User from '../src/models/User';
import Profile from '../src/models/Profile';
import Event from '../src/models/Event';
import Skill from '../src/models/Skill';
import Interest from '../src/models/Interest';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Starting MongoDB seed...');
    
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Event.deleteMany({});
    await Skill.deleteMany({});
    await Interest.deleteMany({});
    
    console.log('🧹 Cleared existing data');
    
    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword,
        role: 'user'
      },
      {
        email: 'organizer@example.com',
        name: 'Event Organizer',
        passwordHash: hashedPassword,
        role: 'organizer'
      },
      {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'admin'
      }
    ]);
    
    console.log('👤 Created users:', users.length);
    
    // Create profiles
    const profiles = await Profile.create([
      {
        userId: users[0]._id.toString(),
        displayName: 'Test User',
        bio: 'A passionate developer looking for exciting projects',
        role: 'developer',
        experience: 'intermediate',
        availability: 'part-time',
        isAvailable: true,
        skills: [],
        interests: []
      },
      {
        userId: users[1]._id.toString(),
        displayName: 'Event Organizer',
        bio: 'Organizing amazing tech events and hackathons',
        role: 'product-manager',
        experience: 'advanced',
        availability: 'full-time',
        isAvailable: true,
        skills: [],
        interests: []
      },
      {
        userId: users[2]._id.toString(),
        displayName: 'Admin User',
        bio: 'Platform administrator',
        role: 'other',
        experience: 'expert',
        availability: 'full-time',
        isAvailable: false,
        skills: [],
        interests: []
      }
    ]);
    
    console.log('📝 Created profiles:', profiles.length);
    
    // Create events
    const events = await Event.create([
      {
        name: 'Tech Innovation Hackathon 2024',
        description: 'A 48-hour hackathon focused on innovative technology solutions for real-world problems.',
        type: 'hackathon',
        category: 'Technology',
        tags: 'innovation,technology,startup,AI,blockchain',
        startDate: new Date('2024-03-15T09:00:00Z'),
        endDate: new Date('2024-03-17T18:00:00Z'),
        location: 'Bangkok, Thailand',
        maxTeams: 50,
        isActive: true
      },
      {
        name: 'Business Case Competition',
        description: 'Solve real business challenges presented by industry partners.',
        type: 'case-competition',
        category: 'Business',
        tags: 'business,strategy,consulting,finance',
        startDate: new Date('2024-04-20T10:00:00Z'),
        endDate: new Date('2024-04-21T17:00:00Z'),
        location: 'Chiang Mai, Thailand',
        maxTeams: 30,
        isActive: true
      },
      {
        name: 'Sustainability Innovation Challenge',
        description: 'Create solutions for environmental and sustainability challenges.',
        type: 'innovation-challenge',
        category: 'Environment',
        tags: 'sustainability,environment,green-tech,climate',
        startDate: new Date('2024-05-10T08:00:00Z'),
        endDate: new Date('2024-05-12T20:00:00Z'),
        location: 'Phuket, Thailand',
        maxTeams: 25,
        isActive: true
      }
    ]);
    
    console.log('📅 Created events:', events.length);
    
    // Create skills
    const skillsData = [
      { name: 'JavaScript', category: 'Programming' },
      { name: 'TypeScript', category: 'Programming' },
      { name: 'Python', category: 'Programming' },
      { name: 'Java', category: 'Programming' },
      { name: 'React', category: 'Frontend' },
      { name: 'Vue.js', category: 'Frontend' },
      { name: 'Angular', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'Express.js', category: 'Backend' },
      { name: 'MongoDB', category: 'Database' },
      { name: 'PostgreSQL', category: 'Database' },
      { name: 'MySQL', category: 'Database' },
      { name: 'Docker', category: 'DevOps' },
      { name: 'Kubernetes', category: 'DevOps' },
      { name: 'AWS', category: 'Cloud' },
      { name: 'Azure', category: 'Cloud' },
      { name: 'Google Cloud', category: 'Cloud' },
      { name: 'Machine Learning', category: 'AI/ML' },
      { name: 'Deep Learning', category: 'AI/ML' },
      { name: 'Data Science', category: 'Data' }
    ];
    
    const skills = await Skill.create(skillsData);
    console.log('📚 Created skills:', skills.length);
    
    // Create interests
    const interestsData = [
      { name: 'Web Development', category: 'Technology' },
      { name: 'Mobile Development', category: 'Technology' },
      { name: 'Artificial Intelligence', category: 'Technology' },
      { name: 'Blockchain', category: 'Technology' },
      { name: 'Cybersecurity', category: 'Technology' },
      { name: 'Data Analytics', category: 'Data' },
      { name: 'Business Strategy', category: 'Business' },
      { name: 'Product Management', category: 'Business' },
      { name: 'Digital Marketing', category: 'Marketing' },
      { name: 'UX/UI Design', category: 'Design' },
      { name: 'Graphic Design', category: 'Design' },
      { name: 'Sustainability', category: 'Environment' },
      { name: 'FinTech', category: 'Finance' },
      { name: 'HealthTech', category: 'Healthcare' },
      { name: 'EdTech', category: 'Education' },
      { name: 'Gaming', category: 'Entertainment' },
      { name: 'IoT', category: 'Technology' },
      { name: 'Robotics', category: 'Technology' },
      { name: 'AR/VR', category: 'Technology' },
      { name: 'Social Impact', category: 'Social' }
    ];
    
    const interests = await Interest.create(interestsData);
    console.log('🎯 Created interests:', interests.length);
    
    console.log('✅ MongoDB seed completed!');
    console.log('👤 Test users created:');
    console.log('   - User: test@example.com (role: user)');
    console.log('   - Organizer: organizer@example.com (role: organizer)');
    console.log('   - Admin: admin@example.com (role: admin)');
    console.log('   - Password for all: password123');
    console.log(`📅 Events available: ${events.length}`);
    console.log(`📚 ${skills.length} skills created`);
    console.log(`🎯 ${interests.length} interests created`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
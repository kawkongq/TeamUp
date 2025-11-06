// @ts-nocheck
import connectDB from '../src/lib/mongodb';
import User from '../src/models/User';
import Profile from '../src/models/Profile';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user' as const,
        avatar: 'https://picsum.photos/200/200?random=1'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user' as const,
        avatar: 'https://picsum.photos/200/200?random=2'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user' as const,
        avatar: 'https://picsum.photos/200/200?random=3'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user' as const,
        avatar: 'https://picsum.photos/200/200?random=4'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin' as const,
        avatar: 'https://picsum.photos/200/200?random=5'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create profiles for users
    const profiles = [
      {
        userId: createdUsers[0]._id.toString(),
        displayName: 'John Doe',
        bio: 'Full-stack developer with 5 years of experience in React and Node.js',
        role: 'Full-Stack Developer',
        location: 'Bangkok, Thailand',
        experience: 'Senior',
        hourlyRate: 50,
        availability: 'available',
        timezone: 'Asia/Bangkok',
        links: {
          github: 'johndoe',
          linkedin: 'johndoe',
          portfolio: 'https://johndoe.dev'
        },
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        interests: ['Web Development', 'AI/ML', 'Startups'],
        isAvailable: true,
        rating: 4.8,
        projectsCompleted: 25
      },
      {
        userId: createdUsers[1]._id.toString(),
        displayName: 'Jane Smith',
        bio: 'UI/UX Designer passionate about creating beautiful and functional designs',
        role: 'UI/UX Designer',
        location: 'Singapore',
        experience: 'Mid',
        hourlyRate: 40,
        availability: 'available',
        timezone: 'Asia/Singapore',
        links: {
          github: 'janesmith',
          linkedin: 'janesmith',
          portfolio: 'https://janesmith.design'
        },
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
        interests: ['Design', 'User Research', 'Product Management'],
        isAvailable: true,
        rating: 4.9,
        projectsCompleted: 18
      },
      {
        userId: createdUsers[2]._id.toString(),
        displayName: 'Mike Johnson',
        bio: 'Backend developer specializing in scalable systems and microservices',
        role: 'Backend Developer',
        location: 'Tokyo, Japan',
        experience: 'Senior',
        hourlyRate: 60,
        availability: 'available',
        timezone: 'Asia/Tokyo',
        links: {
          github: 'mikejohnson',
          linkedin: 'mikejohnson'
        },
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        interests: ['Backend Development', 'DevOps', 'Cloud Computing'],
        isAvailable: true,
        rating: 4.7,
        projectsCompleted: 32
      },
      {
        userId: createdUsers[3]._id.toString(),
        displayName: 'Sarah Wilson',
        bio: 'Data scientist with expertise in machine learning and analytics',
        role: 'Data Scientist',
        location: 'Seoul, South Korea',
        experience: 'Mid',
        hourlyRate: 45,
        availability: 'available',
        timezone: 'Asia/Seoul',
        links: {
          github: 'sarahwilson',
          linkedin: 'sarahwilson'
        },
        skills: ['Python', 'R', 'TensorFlow', 'Pandas'],
        interests: ['Machine Learning', 'Data Analysis', 'AI'],
        isAvailable: true,
        rating: 4.6,
        projectsCompleted: 15
      }
    ];

    const createdProfiles = await Profile.insertMany(profiles);
    console.log(`Created ${createdProfiles.length} profiles`);

    console.log('Database seeded successfully!');
    console.log('\nSample users created:');
    console.log('1. john@example.com / password123');
    console.log('2. jane@example.com / password123');
    console.log('3. mike@example.com / password123');
    console.log('4. sarah@example.com / password123');
    console.log('5. admin@example.com / admin123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();


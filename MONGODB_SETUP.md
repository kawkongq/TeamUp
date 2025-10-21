# MongoDB Setup Guide

## 1. Install MongoDB

### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Ubuntu/Debian:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows:
Download and install from: https://www.mongodb.com/try/download/community

## 2. Environment Configuration

Create `.env.local` file in the project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/hackmatch

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Seed Database

Run the seed script to populate the database with sample data:

```bash
npm run db:seed-mongodb
```

This will create:
- 5 sample users (4 regular users + 1 admin)
- 4 user profiles with skills and interests
- Sample data for testing the swipe functionality

## 4. Start Development Server

```bash
npm run dev
```

## 5. Test the Application

1. Go to http://localhost:3000
2. Sign up with a new account or use existing sample accounts:
   - john@example.com / password123
   - jane@example.com / password123
   - mike@example.com / password123
   - sarah@example.com / password123
   - admin@example.com / admin123

## 6. MongoDB Features

### Models Created:
- **User**: Basic user information and authentication
- **Profile**: Detailed user profiles with skills, interests, and preferences
- **Swipe**: Track user swipe actions (like/pass)
- **Match**: Store mutual matches between users

### Performance Optimizations:
- Indexed queries for fast user lookups
- Compound indexes for swipe and match queries
- Lean queries to reduce memory usage
- Efficient filtering to avoid showing already swiped users

### Database Structure:
```
hackmatch/
├── users/          # User accounts
├── profiles/       # User profiles
├── swipes/         # Swipe actions
└── matches/        # Mutual matches
```

## 7. Troubleshooting

### Connection Issues:
- Make sure MongoDB is running: `brew services list | grep mongodb`
- Check connection string in `.env.local`
- Verify MongoDB is accessible: `mongosh`

### Performance Issues:
- Check MongoDB logs for slow queries
- Use MongoDB Compass for database monitoring
- Consider adding more indexes for large datasets

### Data Issues:
- Clear database: `mongosh hackmatch --eval "db.dropDatabase()"`
- Re-seed data: `npm run db:seed-mongodb`


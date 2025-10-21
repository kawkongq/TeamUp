export interface User {
  id: string;
  email: string;
  displayName: string;
  bio: string;
  role: string;
  timezone: string;
  skills: string[];
  avatar: string;
  experience: string;
  interests: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  rating: number;
  projectsCompleted: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: User[];
  lookingFor: string[];
  eventId: string;
  maxMembers: number;
  currentMembers: number;
  tags: string[];
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  type: 'hackathon' | 'case-competition' | 'innovation-challenge';
  description: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  location: string;
  isOnline: boolean;
  prize: string;
  maxTeamSize: number;
  minTeamSize: number;
  organizer: string;
  website: string;
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  participants: number;
  maxParticipants: number;
  image: string;
}

export const mockUsers: User[] = [
  {
    id: "spc_user",
    email: "spc@gmail.com",
    displayName: "SPC User",
    bio: "Full-stack developer passionate about building innovative solutions and learning new technologies",
    role: "Full-Stack Developer",
    timezone: "Asia/Bangkok",
    skills: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Prisma"],
    avatar: "https://picsum.photos/150/150?random=0",
    experience: "2 years",
    interests: ["Web Development", "AI/ML", "Open Source", "Hackathons"],
    github: "spcuser",
    linkedin: "spc-user-dev",
    portfolio: "spcuser.dev",
    rating: 4.8,
    projectsCompleted: 8
  },
  {
    id: "user_1",
    email: "john@example.com",
    displayName: "John Doe",
    bio: "Frontend developer with 3 years of experience",
    role: "Developer",
    timezone: "Asia/Bangkok",
    skills: ["React", "TypeScript", "Node.js", "CSS", "Git"],
    avatar: "https://picsum.photos/150/150?random=1",
    experience: "3 years",
    interests: ["Web Development", "UI/UX", "Open Source"],
    github: "johndoe",
    linkedin: "john-doe-dev",
    portfolio: "johndoe.dev",
    rating: 4.8,
    projectsCompleted: 15
  },
  {
    id: "user_2",
    email: "jane@example.com",
    displayName: "Jane Smith",
    bio: "Backend developer specializing in Node.js and databases",
    role: "Developer",
    timezone: "Asia/Bangkok",
    skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker"],
    avatar: "https://picsum.photos/150/150?random=2",
    experience: "4 years",
    interests: ["Backend Development", "Database Design", "API Development"],
    github: "janesmith",
    linkedin: "jane-smith-dev",
    portfolio: "janesmith.dev",
    rating: 4.9,
    projectsCompleted: 22
  },
  {
    id: "user_3",
    email: "bob@example.com",
    displayName: "Bob Johnson",
    bio: "Full-stack developer with React and Python expertise",
    role: "Developer",
    timezone: "Asia/Bangkok",
    skills: ["React", "Python", "Django", "AWS", "Docker"],
    avatar: "https://picsum.photos/150/150?random=3",
    experience: "5 years",
    interests: ["Full-stack Development", "Cloud Computing", "DevOps"],
    github: "bobjohnson",
    linkedin: "bob-johnson-dev",
    portfolio: "bobjohnson.dev",
    rating: 4.7,
    projectsCompleted: 28
  },
  {
    id: "user_4",
    email: "alice@example.com",
    displayName: "Alice Brown",
    bio: "UI/UX designer passionate about user experience and accessibility",
    role: "Designer",
    timezone: "Asia/Bangkok",
    skills: ["Figma", "Adobe Creative Suite", "Prototyping", "User Research"],
    avatar: "https://picsum.photos/150/150?random=4",
    experience: "3 years",
    interests: ["UI/UX Design", "Accessibility", "Design Systems"],
    github: "alicebrown",
    linkedin: "alice-brown-design",
    portfolio: "alicebrown.design",
    rating: 4.6,
    projectsCompleted: 18
  },
  {
    id: "user_5",
    email: "charlie@example.com",
    displayName: "Charlie Wilson",
    bio: "Data scientist with machine learning and AI expertise",
    role: "Data Scientist",
    timezone: "Asia/Bangkok",
    skills: ["Python", "R", "TensorFlow", "SQL", "Statistics"],
    avatar: "https://picsum.photos/150/150?random=5",
    experience: "4 years",
    interests: ["Machine Learning", "AI", "Data Analysis"],
    github: "charliewilson",
    linkedin: "charlie-wilson-ds",
    portfolio: "charliewilson.ai",
    rating: 4.9,
    projectsCompleted: 25
  },
  {
    id: "user_6",
    email: "diana@example.com",
    displayName: "Diana Davis",
    bio: "Product manager with agile methodology and user research experience",
    role: "Product Manager",
    timezone: "Asia/Bangkok",
    skills: ["Product Strategy", "User Research", "Agile", "Data Analysis"],
    avatar: "https://picsum.photos/150/150?random=6",
    experience: "5 years",
    interests: ["Product Management", "User Experience", "Business Strategy"],
    github: "dianadavis",
    linkedin: "diana-davis-pm",
    portfolio: "dianadavis.com",
    rating: 4.8,
    projectsCompleted: 20
  },
  {
    id: "user_7",
    email: "eve@example.com",
    displayName: "Eve Miller",
    bio: "DevOps engineer with cloud infrastructure and automation expertise",
    role: "DevOps Engineer",
    timezone: "Asia/Bangkok",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    avatar: "https://picsum.photos/150/150?random=7",
    experience: "6 years",
    interests: ["DevOps", "Cloud Computing", "Automation"],
    github: "evemiller",
    linkedin: "eve-miller-devops",
    portfolio: "evemiller.dev",
    rating: 4.9,
    projectsCompleted: 30
  }
];

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Hackathon 2024",
    type: "hackathon",
    description: "Annual coding competition with amazing prizes",
    startDate: new Date("2024-02-15"),
    endDate: new Date("2024-02-17"),
    registrationDeadline: new Date("2024-02-10"),
    location: "Bangkok",
    isOnline: false,
    prize: "$10,000",
    maxTeamSize: 5,
    minTeamSize: 2,
    organizer: "Tech Community",
    website: "https://hackathon2024.com",
    tags: ["Coding", "Innovation", "Technology"],
    status: "upcoming",
    participants: 120,
    maxParticipants: 200,
    image: "https://picsum.photos/600/400?random=10"
  },
  {
    id: "2",
    name: "Tech Meetup",
    type: "case-competition",
    description: "Monthly tech discussion and networking",
    startDate: new Date("2024-02-20"),
    endDate: new Date("2024-02-20"),
    registrationDeadline: new Date("2024-02-18"),
    location: "Chiang Mai",
    isOnline: false,
    prize: "Networking",
    maxTeamSize: 1,
    minTeamSize: 1,
    organizer: "Tech Meetup Group",
    website: "https://techmeetup.com",
    tags: ["Networking", "Technology", "Discussion"],
    status: "upcoming",
    participants: 45,
    maxParticipants: 50,
    image: "https://picsum.photos/600/400?random=11"
  },
  {
    id: "3",
    name: "Startup Weekend",
    type: "innovation-challenge",
    description: "54-hour startup creation event",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-03-03"),
    registrationDeadline: new Date("2024-02-25"),
    location: "Phuket",
    isOnline: false,
    prize: "$5,000",
    maxTeamSize: 6,
    minTeamSize: 2,
    organizer: "Startup Community",
    website: "https://startupweekend.com",
    tags: ["Startup", "Innovation", "Business"],
    status: "upcoming",
    participants: 80,
    maxParticipants: 100,
    image: "https://picsum.photos/600/400?random=12"
  },
  {
    id: "4",
    name: "AI Workshop",
    type: "hackathon",
    description: "Hands-on machine learning workshop",
    startDate: new Date("2024-03-10"),
    endDate: new Date("2024-03-10"),
    registrationDeadline: new Date("2024-03-05"),
    location: "Bangkok",
    isOnline: false,
    prize: "Certificate",
    maxTeamSize: 3,
    minTeamSize: 1,
    organizer: "AI Institute",
    website: "https://aiworkshop.com",
    tags: ["AI/ML", "Workshop", "Learning"],
    status: "upcoming",
    participants: 20,
    maxParticipants: 25,
    image: "https://picsum.photos/600/400?random=13"
  },
  {
    id: "5",
    name: "Web Development Bootcamp",
    type: "innovation-challenge",
    description: "Intensive web development training",
    startDate: new Date("2024-03-20"),
    endDate: new Date("2024-03-22"),
    registrationDeadline: new Date("2024-03-15"),
    location: "Chiang Mai",
    isOnline: false,
    prize: "Job Placement",
    maxTeamSize: 4,
    minTeamSize: 2,
    organizer: "Coding Academy",
    website: "https://webdevbootcamp.com",
    tags: ["Web Development", "Training", "Career"],
    status: "upcoming",
    participants: 35,
    maxParticipants: 40,
    image: "https://picsum.photos/600/400?random=14"
  }
];

export const mockTeams: Team[] = [
  {
    id: "1",
    name: "AI Health Pioneers",
    description: "Building AI-powered diagnostic tools for early disease detection. Focus on accessibility and affordability.",
    members: [mockUsers[0], mockUsers[2]],
    lookingFor: ["UI/UX Designer", "Healthcare Domain Expert"],
    eventId: "1",
    maxMembers: 5,
    currentMembers: 2,
    tags: ["AI/ML", "Healthcare", "Diagnostics", "Accessibility"],
    createdAt: new Date("2024-02-15")
  },
  {
    id: "2",
    name: "GreenTech Solutions",
    description: "Developing sustainable technology for urban farming and food security. Using IoT and data analytics.",
    members: [mockUsers[1], mockUsers[4]],
    lookingFor: ["Data Scientist", "Hardware Engineer"],
    eventId: "5",
    maxMembers: 5,
    currentMembers: 2,
    tags: ["Sustainability", "IoT", "Urban Farming", "Food Security"],
    createdAt: new Date("2024-02-20")
  },
  {
    id: "3",
    name: "DeFi Revolution",
    description: "Creating innovative DeFi protocols for financial inclusion. Building on multiple blockchain platforms.",
    members: [mockUsers[3], mockUsers[5]],
    lookingFor: ["Blockchain Developer", "Financial Analyst"],
    eventId: "3",
    maxMembers: 6,
    currentMembers: 2,
    tags: ["DeFi", "Blockchain", "Financial Inclusion", "Smart Contracts"],
    createdAt: new Date("2024-02-25")
  },
  {
    id: "4",
    name: "Social Impact Squad",
    description: "Solving education accessibility challenges through technology. Building platforms for remote learning.",
    members: [mockUsers[1], mockUsers[4]],
    lookingFor: ["Full-Stack Developer", "Education Specialist"],
    eventId: "2",
    maxMembers: 4,
    currentMembers: 2,
    tags: ["Education", "Social Impact", "Remote Learning", "Accessibility"],
    createdAt: new Date("2024-02-28")
  }
];

export const mockSkills = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "Java", "Go", "C++",
  "Machine Learning", "Data Science", "UI/UX Design", "Product Management",
  "Blockchain", "Cloud Computing", "DevOps", "Mobile Development",
  "AI/ML", "Computer Vision", "NLP", "Robotics", "IoT", "Cybersecurity",
  "Business Strategy", "Market Research", "Financial Analysis", "Social Impact"
];

export const mockRoles = [
  "Full-Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer",
  "Data Scientist", "ML Engineer", "UI/UX Designer", "Product Manager",
  "DevOps Engineer", "Blockchain Developer", "Hardware Engineer", "Business Analyst"
];

export const mockInterests = [
  "AI/ML", "Web3", "Sustainability", "Healthcare", "Education", "Finance",
  "Climate Tech", "Social Impact", "Gaming", "E-commerce", "Fintech", "Edtech"
];

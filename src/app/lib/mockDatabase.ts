// Mock Database for Admin Dashboard
// This simulates real database operations

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  participantCount: number;
  createdAt: string;
}

// Mock data storage (in real app, this would be database)
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'developer',
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'designer',
    status: 'active',
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'product-manager',
    status: 'inactive',
    createdAt: '2024-03-10'
  },
  {
    id: '4',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'data-scientist',
    status: 'active',
    createdAt: '2024-03-15'
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'developer',
    status: 'active',
    createdAt: '2024-04-01'
  }
];

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'React Developers',
    description: 'Frontend team working on React applications',
    memberCount: 5,
    createdBy: '1',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'Backend Engineers',
    description: 'API development and server management',
    memberCount: 3,
    createdBy: '2',
    createdAt: '2024-02-15'
  },
  {
    id: '3',
    name: 'UI/UX Designers',
    description: 'Design team creating amazing user experiences',
    memberCount: 4,
    createdBy: '3',
    createdAt: '2024-03-01'
  }
];

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Hackathon 2024',
    description: 'Annual hackathon for developers and designers',
    startDate: '2024-06-01',
    endDate: '2024-06-03',
    location: 'Bangkok, Thailand',
    participantCount: 150,
    createdAt: '2024-03-01'
  },
  {
    id: '2',
    title: 'Tech Conference',
    description: 'Latest trends in technology and innovation',
    startDate: '2024-07-15',
    endDate: '2024-07-16',
    location: 'Chiang Mai, Thailand',
    participantCount: 200,
    createdAt: '2024-04-01'
  },
  {
    id: '3',
    title: 'Design Workshop',
    description: 'UI/UX design workshop for beginners',
    startDate: '2024-08-10',
    endDate: '2024-08-10',
    location: 'Online',
    participantCount: 75,
    createdAt: '2024-05-01'
  }
];

// User operations
export const mockDatabase = {
  // Users
  getUsers: (): User[] => [...mockUsers],
  
  getUserById: (id: string): User | undefined => 
    mockUsers.find(user => user.id === id),
  
  deleteUser: (id: string): boolean => {
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return true;
    }
    return false;
  },
  
  updateUser: (id: string, updates: Partial<User>): User | null => {
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...updates };
      return mockUsers[index];
    }
    return null;
  },
  
  toggleUserStatus: (id: string): User | null => {
    const user = mockUsers.find(user => user.id === id);
    if (user) {
      user.status = user.status === 'active' ? 'inactive' : 'active';
      return user;
    }
    return null;
  },

  // Teams
  getTeams: (): Team[] => [...mockTeams],
  
  getTeamById: (id: string): Team | undefined => 
    mockTeams.find(team => team.id === id),
  
  deleteTeam: (id: string): boolean => {
    const index = mockTeams.findIndex(team => team.id === id);
    if (index !== -1) {
      mockTeams.splice(index, 1);
      return true;
    }
    return false;
  },
  
  updateTeam: (id: string, updates: Partial<Team>): Team | null => {
    const index = mockTeams.findIndex(team => team.id === id);
    if (index !== -1) {
      mockTeams[index] = { ...mockTeams[index], ...updates };
      return mockTeams[index];
    }
    return null;
  },

  // Events
  getEvents: (): Event[] => [...mockEvents],
  
  getEventById: (id: string): Event | undefined => 
    mockEvents.find(event => event.id === id),
  
  deleteEvent: (id: string): boolean => {
    const index = mockEvents.findIndex(event => event.id === id);
    if (index !== -1) {
      mockEvents.splice(index, 1);
      return true;
    }
    return false;
  },
  
  updateEvent: (id: string, updates: Partial<Event>): Event | null => {
    const index = mockEvents.findIndex(event => event.id === id);
    if (index !== -1) {
      mockEvents[index] = { ...mockEvents[index], ...updates };
      return mockEvents[index];
    }
    return null;
  },

  // Statistics
  getStats: () => ({
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.status === 'active').length,
    totalTeams: mockTeams.length,
    totalEvents: mockEvents.length
  })
};

export type { User, Team, Event };

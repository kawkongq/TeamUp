"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PersonCard from '../components/PersonCard';
import PersonProfileModal from '../components/PersonProfileModal';
import InviteToTeamModal from '../components/InviteToTeamModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { debugLog } from '@/lib/logger';


interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  location: string;
  skills: string[];
  experience: string;
  interests: string[];
  status: string;
  bio: string;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  rating: number;
  projectsCompleted: number;
  hourlyRate?: number | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [invitePerson, setInvitePerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPeople();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/people');
      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = async (personId: string) => {
    if (!currentUser) {
      debugLog('No current user, redirecting to signin');
      router.push('/signin');
      return;
    }

    if (!currentUser.id) {
      console.error('Current user has no ID:', currentUser);
      return;
    }

    if (!personId) {
      console.error('No person ID provided');
      return;
    }

    try {
      debugLog('Creating chat between:', { senderId: currentUser.id, receiverId: personId });
      debugLog('Current user object:', currentUser);
      
      // Create or get existing chat
      const requestBody = {
        senderId: currentUser.id,
        receiverId: personId
      };
      
      debugLog('Request body being sent:', requestBody);
      debugLog('Request URL:', '/api/chat');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      debugLog('Response status:', response.status);
      debugLog('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        debugLog('Chat created successfully:', data);
        // Store chat information in localStorage for the chat page to use
        localStorage.setItem('selectedChat', JSON.stringify(data.chat));
        // Navigate to chat page
        router.push('/chat');
      } else {
        const errorData = await response.json();
        console.error('Failed to create chat:', response.status, errorData);
        
        // Try to get the response text as well
        try {
          const responseText = await response.text();
          console.error('Response text:', responseText);
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || person.role.toLowerCase().includes(filterRole.toLowerCase());
    
    return matchesSearch && matchesRole;
  });

  const handleViewProfile = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleInviteToTeam = (person: Person) => {
    setInvitePerson(person);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mb-4" />
          <p className="text-gray-600 text-lg">Loading amazing people...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing People</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with talented developers, designers, and innovators from around the world
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-indigo-600">{filteredPeople.length}</span> of {people.length} people
            </span>
            {currentUser ? (
              <span className="text-green-600 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Signed in as {currentUser.name || currentUser.email}
              </span>
            ) : (
              <Link href="/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in to connect →
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Role Filter */}
            <div className="md:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
              </select>
            </div>
          </div>
        </div>

        {/* People Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                currentUser={currentUser}
                onViewProfile={handleViewProfile}
                onInviteToTeam={handleInviteToTeam}
                onStartChat={handleChatClick}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredPeople.length === 0 && people.length > 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
              <p className="text-gray-600">Try adjusting your search or filters to find more people.</p>
            </div>
          )}

          {people.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No people available</h3>
              <p className="text-gray-600">The database appears to be empty or there was an error loading data.</p>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {selectedPerson && (
          <PersonProfileModal
            person={selectedPerson as any}
            currentUser={currentUser}
            onClose={() => setSelectedPerson(null)}
            onInviteToTeam={handleInviteToTeam as any}
            onStartChat={handleChatClick}
          />
        )}

        {/* Invite to Team Modal */}
        {invitePerson && currentUser && (
          <InviteToTeamModal
            person={invitePerson}
            currentUserId={currentUser.id}
            onClose={() => setInvitePerson(null)}
            onSuccess={() => {
              setInvitePerson(null);
              showToast({
                type: 'success',
                title: 'Invitation Sent!',
                message: `Successfully invited ${invitePerson.name} to your team`
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

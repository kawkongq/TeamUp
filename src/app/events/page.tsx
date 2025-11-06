"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import CreateTeamForEvent from '../components/CreateTeamForEvent';
import EventTimeline from '../components/EventTimeline';
import EventResources from '../components/EventResources';
import EventRegistrations from '../components/EventRegistrations';
import TeamEventRegistration from '../components/TeamEventRegistration';
import { canCreateEvents } from '@/lib/auth-utils';

interface Event {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string;
  startDate: string;
  endDate: string;
  location?: string;
  imageUrl?: string;
  maxTeams?: number;
  isActive: boolean;
  createdAt: string;
  teams?: Array<{
    id: string;
    name: string;
    members: any[];
  }>;
}

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventForTeam, setSelectedEventForTeam] = useState<Event | null>(null);
  const [selectedEventForTimeline, setSelectedEventForTimeline] = useState<Event | null>(null);
  const [selectedEventForResources, setSelectedEventForResources] = useState<Event | null>(null);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<Event | null>(null);
  const [selectedEventForTeamRegistration, setSelectedEventForTeamRegistration] = useState<Event | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    checkUserRole();
    fetchEvents();
  }, []);



  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Load Events',
          message: 'Could not load events'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server'
      });
    }
  };



  const handleCreateTeamForEvent = (event: Event) => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to create a team'
      });
      return;
    }
    setSelectedEventForTeam(event);
  };

  const handleTeamRegistration = (event: Event) => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to register teams for events'
      });
      return;
    }
    setSelectedEventForTeamRegistration(event);
  };

  // Check if user can create events (organizer or admin)
  const userCanCreateEvents = canCreateEvents(currentUser);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active') return matchesSearch && event.isActive;
    if (activeFilter === 'upcoming') return matchesSearch && new Date(event.startDate) > new Date();
    if (activeFilter === 'past') return matchesSearch && new Date(event.endDate) < new Date();
    
    return matchesSearch && event.type === activeFilter;
  });

  const filters = [
    { id: 'all', label: 'All Events', count: events.length },
    { id: 'hackathon', label: 'Hackathons', count: events.filter(e => e.type === 'hackathon').length },
    { id: 'case-competition', label: 'Competitions', count: events.filter(e => e.type === 'case-competition').length },
    { id: 'innovation-challenge', label: 'Challenges', count: events.filter(e => e.type === 'innovation-challenge').length },
    { id: 'active', label: 'Active', count: events.filter(e => e.isActive).length },
    { id: 'upcoming', label: 'Upcoming', count: events.filter(e => new Date(e.startDate) > new Date()).length }
  ];

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Events</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find hackathons, conferences, meetups, and workshops that match your interests and skills
          </p>
          
          {/* Create Event Button - Only for Organizer and Admin */}
          {userCanCreateEvents && (
            <div className="mt-6">
              <Link
                href="/events/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Event
              </Link>
              
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {filter.label}
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Event Header */}
                <div className="h-48 relative overflow-hidden">
                  {event.imageUrl ? (
                    <>
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-indigo-400', 'to-purple-600');
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30"></div>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600"></div>
                      <div className="absolute inset-0 bg-black/20"></div>
                    </>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      event.type === 'hackathon' ? 'bg-yellow-100/90 text-yellow-800' :
                      event.type === 'case-competition' ? 'bg-blue-100/90 text-blue-800' :
                      'bg-green-100/90 text-green-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium drop-shadow-lg">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </p>
                    {event.location && (
                      <p className="text-xs opacity-90 drop-shadow-lg">{event.location}</p>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {event.name.charAt(0)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                  {/* Category */}
                  {event.category && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {event.category}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {event.tags && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {event.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.teams?.length || 0} teams
                      </div>

                    </div>
                    <span className={`text-sm font-medium ${
                      event.isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Primary Action - Team Registration */}
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handleTeamRegistration(event)}
                      disabled={!event.isActive}
                    >
                      Register Team for Event
                    </Button>

                    {/* Organizer/Admin Actions */}
                    {userCanCreateEvents && (
                      <button
                        onClick={() => setSelectedEventForRegistrations(event)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Team Registrations
                      </button>
                    )}
                    
                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedEventForTimeline(event)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Timeline
                      </button>
                      <button
                        onClick={() => setSelectedEventForResources(event)}
                        className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Resources
                      </button>
                    </div>
                    
                    {/* Team Actions */}
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleCreateTeamForEvent(event)}
                      disabled={!event.isActive}
                    >
                      Create Team for This Event
                    </Button>
                    <Link 
                      href={`/teams?event=${event.id}`}
                      className="block w-full text-center px-4 py-2 text-indigo-600 hover:text-indigo-700 transition-colors text-sm"
                    >
                      View Existing Teams →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find more events.</p>
          </div>
        )}


      </div>

      {/* Create Team for Event Modal */}
      {selectedEventForTeam && (
        <CreateTeamForEvent
          event={selectedEventForTeam}
          onClose={() => setSelectedEventForTeam(null)}
          onSuccess={() => {
            setSelectedEventForTeam(null);
            fetchEvents(); // Refresh events to show updated team count
          }}
        />
      )}

      {/* Event Timeline Modal */}
      {selectedEventForTimeline && (
        <EventTimeline
          eventId={selectedEventForTimeline.id}
          canEdit={currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin')}
          onClose={() => setSelectedEventForTimeline(null)}
        />
      )}

      {/* Event Resources Modal */}
      {selectedEventForResources && (
        <EventResources
          eventId={selectedEventForResources.id}
          canEdit={currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin')}
          onClose={() => setSelectedEventForResources(null)}
        />
      )}

      {/* Event Registrations Modal */}
      {selectedEventForRegistrations && (
        <EventRegistrations
          eventId={selectedEventForRegistrations.id}
          eventName={selectedEventForRegistrations.name}
          onClose={() => setSelectedEventForRegistrations(null)}
        />
      )}

      {/* Team Event Registration Modal */}
      {selectedEventForTeamRegistration && (
        <TeamEventRegistration
          event={selectedEventForTeamRegistration}
          onClose={() => setSelectedEventForTeamRegistration(null)}
          onSuccess={() => {
            setSelectedEventForTeamRegistration(null);
            fetchEvents(); // Refresh events to show updated registration count
          }}
        />
      )}
    </div>
  );
}

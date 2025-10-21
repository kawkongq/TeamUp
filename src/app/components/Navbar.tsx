"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const checkAuthStatus = async (retryCount = 0) => {
    try {
      // Check if user has logged out
      if (document.cookie.includes('logged_out=true')) {
        setIsLoggedIn(false);
        setUserEmail("");
        setUserProfile(null);
        setUserRole(null);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10 second timeout

      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('Auth check response:', data);

          if (data.authenticated && data.user?.id) {
            // Check if user is deleted
            if (data.user.name?.startsWith('[DELETED]')) {
              console.log('Detected deleted user, logging out...');
              handleSignOut();
              return;
            }
            
            setIsLoggedIn(true);
            setUserEmail(data.user.email || "");
            setUserRole(data.user.role || null);
            setCurrentUserId(data.user.id);

            // Fetch user profile only if we have a user ID
            try {
              const profileResponse = await fetch(`/api/profile?userId=${data.user.id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });

              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                setUserProfile(profileData.profile);
              } else {
                console.warn(`Profile fetch failed with status: ${profileResponse.status}`);
              }
            } catch (profileError) {
              console.error('Profile fetch error:', profileError);
            }

            // Fetch invitation count
            try {
              const invitationResponse = await fetch(`/api/invitations?userId=${data.user.id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });

              if (invitationResponse.ok) {
                const invitationData = await invitationResponse.json();
                setInvitationCount(invitationData.count || 0);
              }
            } catch (invitationError) {
              console.error('Invitation fetch error:', invitationError);
            }
          } else {
            setIsLoggedIn(false);
            setUserEmail("");
            setUserProfile(null);
            setUserRole(null);
          }
        } else {
          console.warn(`Auth check failed with status: ${response.status}`);
          // Fallback: check localStorage
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
            setIsLoggedIn(true);
            setUserEmail(storedEmail);
          } else {
            setIsLoggedIn(false);
            setUserEmail("");
            setUserProfile(null);
            setUserRole(null);
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.log('Auth check request was aborted due to timeout');
          setIsLoggedIn(false);
          setUserEmail("");
          setUserRole(null);
          setCurrentUserId(null);
          setUserProfile(null);
          return;
        }

        console.error('Auth check error:', error);

        // Retry logic for network errors
        if (retryCount < 2 && (error instanceof TypeError || error?.name === 'AbortError')) {
          console.log(`Retrying auth check in 1 second... (attempt ${retryCount + 1})`);
          setTimeout(() => checkAuthStatus(retryCount + 1), 1000);
          return;
        }

        // Fallback: check localStorage
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          setIsLoggedIn(true);
          setUserEmail(storedEmail);
        } else {
          setIsLoggedIn(false);
          setUserEmail("");
          setUserProfile(null);
          setUserRole(null);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
      setUserEmail("");
      setUserRole(null);
      setCurrentUserId(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Add a small delay before first check to ensure the app is fully loaded
    const initialDelay = setTimeout(() => {
      checkAuthStatus();
    }, 100);

    // Check auth status periodically
    const interval = setInterval(checkAuthStatus, 10000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUserEmail("");
        setUserRole(null);
        setCurrentUserId(null);
        setUserProfile(null);
        setInvitationCount(0);
        
        // Clear localStorage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        
        // Redirect to home page
        router.push('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Force logout even if API call fails
      setIsLoggedIn(false);
      setUserEmail("");
      setUserRole(null);
      setCurrentUserId(null);
      setUserProfile(null);
      setInvitationCount(0);
      
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      
      router.push('/');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TeamUp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                {userRole === 'admin' && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link href="/people" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  People
                </Link>
                <Link href="/teams" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Teams
                </Link>
                <Link href="/events" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Events
                </Link>
                <Link href="/swipe" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Swipe Mode
                </Link>
                <Link href="/chat" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Chat
                </Link>
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  {invitationCount > 0 && (
                    <div className="relative">
                      <Link href="/invitations" className="text-gray-700 hover:text-indigo-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
                        </svg>
                      </Link>
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {invitationCount}
                      </span>
                    </div>
                  )}
                  
                  <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    {userProfile?.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {userEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{userEmail}</span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isLoggedIn ? (
                <>
                  {userRole === 'admin' && (
                    <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                      Dashboard
                    </Link>
                  )}
                  <Link href="/people" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    People
                  </Link>
                  <Link href="/teams" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Teams
                  </Link>
                  <Link href="/events" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Events
                  </Link>
                  <Link href="/swipe" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Swipe Mode
                  </Link>
                  <Link href="/chat" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Chat
                  </Link>
                  <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
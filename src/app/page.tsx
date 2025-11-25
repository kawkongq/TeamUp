"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useNotification } from './contexts/NotificationContext';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useNotification();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Check for session cookie
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserEmail(data.user?.email || null);
          
          // Show welcome notification if user just signed in
          const justSignedIn = localStorage.getItem('justSignedIn');
          if (justSignedIn === 'true') {
            localStorage.removeItem('justSignedIn'); // Remove flag
            setTimeout(() => {
              // Use stored name from localStorage if user name is deleted
              const storedName = localStorage.getItem('userName');
              const displayName = (data.user?.name?.startsWith('[DELETED]') ? storedName : data.user?.name) || data.user?.email;
              
              showSuccess(
                '🎉 Welcome Back!',
                `Hello ${displayName}! You're successfully signed in to TeamUp.`
              );
            }, 500); // Small delay to ensure page is loaded
          }
        } else {
          // Check localStorage as fallback
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
            setIsAuthenticated(true);
            setUserEmail(storedEmail);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Check localStorage as fallback
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          setIsAuthenticated(true);
          setUserEmail(storedEmail);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur opacity-25 animate-pulse"></div>
          </div>
          <p className="text-gray-600 text-xl font-medium animate-pulse">Loading amazing things...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[80vh] flex flex-col justify-center relative">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-10 animate-fade-in-up">
            <div className="space-y-8">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:shadow-glow">
                🚀 Find Your Perfect Team
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-balance">
                <span className="gradient-text-primary hover:text-gradient-animated transition-all duration-500">
                  TeamUp
                </span>
                <br />
                <span className="text-gray-900">
                  Your Gateway to
                </span>
                <br />
                <span className="text-gray-900">
                  Amazing Teams
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl text-balance">
                Connect with talented developers, designers, and innovators.
                Build your dream hackathon team in minutes, not days.
              </p>
            </div>

            {/* Welcome Message for Authenticated Users */}
            {isAuthenticated && userEmail && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-800 font-medium">
                    Welcome back! You're signed in as <strong className="text-green-900">{userEmail}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 py-8">
              <div className="text-center group">
                <div className="text-4xl font-bold text-indigo-600 group-hover:scale-110 transition-transform duration-300 mb-2 hover:text-gradient-animated">500+</div>
                <div className="text-sm text-gray-500 font-medium">Active Users</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-300 mb-2 hover:text-gradient-animated">200+</div>
                <div className="text-sm text-gray-500 font-medium">Teams Formed</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-pink-600 group-hover:scale-110 transition-transform duration-300 mb-2 hover:text-gradient-animated">50+</div>
                <div className="text-sm text-gray-500 font-medium">Hackathons</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/signup"
                    className="btn-primary text-lg px-8 py-4 hover:scale-105 relative overflow-hidden"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <svg className="ml-2 w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/signin"
                    className="btn-secondary text-lg px-8 py-4 hover:scale-105"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/teams"
                    className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span>Browse Teams</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white/70 px-8 py-4 text-lg font-semibold text-indigo-700 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >
                    <span>Edit Profile</span>
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-6 6h6m-6 4h6m4-14h-4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V3a2 2 0 00-2-2z" />
                    </svg>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4 font-medium">Trusted by teams from</p>
              <div className="flex items-center space-x-8 opacity-60">
                <div className="text-gray-400 font-semibold hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:text-indigo-600">MIT</div>
                <div className="text-gray-400 font-semibold hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:text-purple-600">Stanford</div>
                <div className="text-gray-400 font-semibold hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:text-pink-600">Google</div>
                <div className="text-gray-400 font-semibold hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:text-cyan-600">Microsoft</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-in-up animation-delay-2000">
            <div className="relative z-10">
              <div className="relative rounded-3xl overflow-hidden shadow-3xl hover:shadow-2xl transition-all duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                <Image
                  src="/main.jpg"
                  alt="TeamUp - Find Your Perfect Hackathon Team"
                  width={600}
                  height={700}
                  className="w-full h-auto relative z-10 group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl flex items-center justify-center animate-float hover:scale-110 transition-transform duration-300 hover:shadow-glow-warm">
                <div className="text-white font-bold text-sm text-center">
                  <div className="text-3xl mb-1">🚀</div>
                  <div>Live</div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-2xl flex items-center justify-center animate-float animation-delay-4000 hover:scale-110 transition-transform duration-300 hover:shadow-glow-accent">
                <div className="text-white font-bold text-xs text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <div>Fast</div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-200 to-red-200 rounded-full blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Section */}
      <div className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Explore TeamUp
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
            Discover events, find teams, and connect with talented people
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/events" className="group">
            <div className="card-ultra p-8 hover:scale-105 transition-all duration-300 hover:shadow-glow">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Events</h3>
              <p className="text-gray-600 text-center mb-8 text-balance">Browse hackathons, case competitions, and innovation challenges</p>
              <div className="text-center">
                <span className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors duration-200">
                  Explore Events
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          <Link href="/teams" className="group">
            <div className="card-ultra p-8 hover:scale-105 transition-all duration-300 hover:shadow-glow-purple">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-glow-purple">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Teams</h3>
              <p className="text-gray-600 text-center mb-8 text-balance">Find existing teams or create your own for upcoming events</p>
              <div className="text-center">
                <span className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors duration-200">
                  Find Teams
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          <Link href="/people" className="group">
            <div className="card-ultra p-8 hover:scale-105 transition-all duration-300 hover:shadow-glow-accent">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-glow-accent">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">People</h3>
              <p className="text-gray-600 text-center mb-8 text-balance">Discover talented developers, designers, and innovators</p>
              <div className="text-center">
                <span className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors duration-200">
                  Meet People
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Why Choose TeamUp?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
            We've built the most efficient way to find your perfect hackathon teammates
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl card-ultra hover:scale-105 transition-all duration-300 hover:shadow-glow group">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-glow transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Smart Matching</h3>
            <p className="text-gray-600 text-balance">AI-powered algorithm helps you find compatible teammates based on skills and preferences</p>
          </div>

          <div className="text-center p-8 rounded-2xl card-ultra hover:scale-105 transition-all duration-300 hover:shadow-glow-purple group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-glow-purple transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Lightning Fast</h3>
            <p className="text-gray-600 text-balance">Find and connect with teammates in minutes, not hours. Get started immediately</p>
          </div>

          <div className="text-center p-8 rounded-2xl card-ultra hover:scale-105 transition-all duration-300 hover:shadow-glow-accent group">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-glow-accent transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Verified Profiles</h3>
            <p className="text-gray-600 text-balance">All users are verified and vetted. Build trust with real teammates</p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../components/Button';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam) {
      return;
    }

    const messages: Record<string, string> = {
      access_denied: 'Google sign-in was cancelled. Please try again.',
      google_not_configured: 'Google sign-in is not available yet. Please contact support.',
      google_oauth_state_mismatch: 'Google sign-in session expired. Please try again.',
      google_oauth_failed: 'Google sign-in failed. Please try again.',
    };

    setOauthError(messages[errorParam] ?? 'Unable to complete Google sign-in. Please try again.');

    // Clean the query params so the message is not persistent after reload
    router.replace('/signin', { scroll: false });
  }, [router, searchParams]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          // User is already authenticated, redirect to home
          router.push('/');
          return;
        }
      }
      // User not authenticated, show signin form
      setLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGoogleSignin = () => {
    setGoogleRedirecting(true);
    setOauthError(null);
    window.location.href = '/api/auth/google/start';
  };

  // const validateForm = () => {
  //   const newErrors: Record<string, string> = {};
    
  //   if (!formData.email.trim()) newErrors.email = 'Email is required';
  //   else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
  //   if (!formData.password) newErrors.password = 'Password is required';
    
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user info in localStorage for fallback
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('justSignedIn', 'true'); // Flag to show welcome notification on home page
        
        // Redirect to home immediately
        router.push('/');
      } else {
        const errorData = await response.json();
        showToast({
          type: 'error',
          title: 'Sign In Failed',
          message: errorData.error || 'Please check your email and password'
        });
        setErrors({ general: errorData.error || 'Signin failed' });
      }
    } catch (error) {
      console.error('Signin error:', error);
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect. Please try again.'
      });
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      {loading ? (
        <div className="text-center">
          <LoadingSpinner size="xl" className="mb-4" />
          <p className="text-gray-600 text-lg">Checking authentication...</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">T</span>
              </div>
              <span className="text-3xl font-bold gradient-text-primary">TeamUp</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Signin Form */}
        <div className="glass-card rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-indigo-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-indigo-300'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>



            {/* General Error Display */}
            {(errors.general || oauthError) && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
                    !
                  </span>
                  <div className="space-y-1">
                    {errors.general && <p>{errors.general}</p>}
                    {oauthError && <p>{oauthError}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={submitting}
              loadingText="Signing in..."
              size="lg"
              fullWidth
              className="py-4"
            >
              Sign In
            </Button>
          </form>

          {/* Social Signin */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleAuthButton
              label="Continue with Google"
              onClick={handleGoogleSignin}
              loading={googleRedirecting}
              loadingText="Connecting..."
            />

            {googleRedirecting && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Redirecting to Google... If nothing happens, please disable popup blockers and try again.
              </p>
            )}
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-semibold">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
      )}
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SigninContent />
    </Suspense>
  );
}

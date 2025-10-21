import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';

export async function GET(request: NextRequest) {
  try {
    // Get cookies and headers for debugging
    const cookies = request.headers.get('cookie');
    const userAgent = request.headers.get('user-agent');
    
    console.log('Auth check request:', {
      cookies: cookies ? 'present' : 'missing',
      userAgent: userAgent?.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    // Check if user has logged out
    if (cookies && cookies.includes('logged_out=true')) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        timestamp: new Date().toISOString(),
        debug: {
          cookiesPresent: true,
          userAgentPresent: !!userAgent,
          note: 'User has logged out'
        }
      });
    }

    // Check if user is authenticated via user_id cookie
    if (cookies && cookies.includes('user_id=')) {
      const userIdMatch = cookies.match(/user_id=([^;]+)/);
      if (userIdMatch) {
        const userId = userIdMatch[1];
        
        try {
          // Connect to MongoDB
          await connectDB();
          
          // Check if userId is valid MongoDB ObjectId format
          if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            console.log('Invalid ObjectId format, clearing cookies:', userId);
            const response = NextResponse.json({
              authenticated: false,
              user: null,
              timestamp: new Date().toISOString(),
              debug: {
                cookiesPresent: true,
                userAgentPresent: !!userAgent,
                note: 'Invalid user ID format - cleared cookies'
              }
            });
            
            // Clear invalid cookies
            response.cookies.set('user_id', '', { expires: new Date(0) });
            response.cookies.set('logged_out', 'true', { maxAge: 60 * 60 * 24 });
            
            return response;
          }
          
          // Fetch real user data from database
          const user = await User.findById(userId);
          const profile = await Profile.findOne({ userId });

          if (user) {
            // Check if user is deleted
            if (user.name?.startsWith('[DELETED]')) {
              // User is deleted, force logout
              const response = NextResponse.json({
                authenticated: false,
                user: null,
                timestamp: new Date().toISOString(),
                debug: {
                  cookiesPresent: true,
                  userAgentPresent: !!userAgent,
                  note: 'User account has been deleted'
                }
              });
              
              // Clear cookies
              response.cookies.set('user_id', '', { expires: new Date(0) });
              response.cookies.set('logged_out', 'true', { maxAge: 60 * 60 * 24 });
              
              return response;
            }
            
            return NextResponse.json({
              authenticated: true,
              user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                profile: profile
              },
              timestamp: new Date().toISOString(),
              debug: {
                cookiesPresent: true,
                userAgentPresent: !!userAgent,
                note: 'Authenticated via user_id cookie'
              }
            });
          }
        } catch (dbError) {
          console.error('Database error in auth check:', dbError);
          
          // Fallback: return basic user info from localStorage/cookies
          return NextResponse.json({
            authenticated: true,
            user: {
              id: userId,
              email: 'user@example.com', // Fallback email
              name: 'User',
              role: userId === '1' ? 'admin' : 'user', // Make user ID '1' admin
              profile: null
            },
            timestamp: new Date().toISOString(),
            debug: {
              cookiesPresent: true,
              userAgentPresent: !!userAgent,
              note: 'Fallback authentication (DB error)'
            }
          });
        }
      }
    }

    // Fallback: no authentication found
    return NextResponse.json({
      authenticated: false,
      user: null,
      timestamp: new Date().toISOString(),
      debug: {
        cookiesPresent: !!cookies,
        userAgentPresent: !!userAgent,
        note: 'No authentication found'
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

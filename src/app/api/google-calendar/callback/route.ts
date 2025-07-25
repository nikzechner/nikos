import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { saveGoogleCalendarTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  console.log('🚀 CALLBACK ROUTE HIT - URL:', request.url);
  console.log('=== Google Calendar Callback Route Hit ===');
  console.log('Request URL:', request.url);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the user ID
    const error = searchParams.get('error');

    console.log('OAuth params:', { code: !!code, state, error });

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard?google_calendar_error=access_denied', request.url));
    }

    if (!code || !state) {
      console.error('Missing OAuth params:', { code: !!code, state });
      return NextResponse.redirect(new URL('/dashboard?google_calendar_error=missing_params', request.url));
    }

    console.log('Environment check:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log('Exchanging code for tokens...');
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      console.error('No access token received');
      return NextResponse.redirect(new URL('/dashboard?google_calendar_error=no_access_token', request.url));
    }

    console.log('Saving tokens to database...');
    // Save tokens to database
    await saveGoogleCalendarTokens(state, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      token_type: tokens.token_type || 'Bearer',
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      scope: tokens.scope,
    });

    console.log('Redirecting to dashboard with success...');
    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?google_calendar_connected=true', request.url));
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?google_calendar_error=callback_failed', request.url));
  }
} 
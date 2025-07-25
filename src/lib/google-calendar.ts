import { google } from 'googleapis';
import { auth } from '@clerk/nextjs/server';
import { supabase } from './supabase';

// Types for Google Calendar integration
export interface GoogleCalendarToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: string;
  scope?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  created?: string;
  updated?: string;
}

// Google Calendar Service Class
export class GoogleCalendarService {
  private calendar: any;
  private oauth2Client: any;

  constructor(tokens: GoogleCalendarToken) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expiry_date: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Get upcoming events for the next 3 days
  async getUpcomingEvents(maxResults: number = 50): Promise<GoogleCalendarEvent[]> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: threeDaysFromNow.toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw new Error('Failed to fetch Google Calendar events');
    }
  }

  // Create a new event
  async createEvent(event: {
    summary: string;
    description?: string;
    start: string; // ISO string
    end: string; // ISO string
    timeZone?: string;
  }): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start,
            timeZone: event.timeZone || 'America/New_York',
          },
          end: {
            dateTime: event.end,
            timeZone: event.timeZone || 'America/New_York',
          },
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  }

  // Update an existing event
  async updateEvent(eventId: string, event: {
    summary?: string;
    description?: string;
    start?: string; // ISO string
    end?: string; // ISO string
    timeZone?: string;
  }): Promise<GoogleCalendarEvent> {
    try {
      const updateData: any = {};
      
      if (event.summary) updateData.summary = event.summary;
      if (event.description) updateData.description = event.description;
      if (event.start) {
        updateData.start = {
          dateTime: event.start,
          timeZone: event.timeZone || 'America/New_York',
        };
      }
      if (event.end) {
        updateData.end = {
          dateTime: event.end,
          timeZone: event.timeZone || 'America/New_York',
        };
      }

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updateData,
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error('Failed to update Google Calendar event');
    }
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error('Failed to delete Google Calendar event');
    }
  }

  // Refresh access token if needed
  async refreshTokenIfNeeded(): Promise<GoogleCalendarToken | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        return {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          token_type: credentials.token_type || 'Bearer',
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : undefined,
          scope: credentials.scope,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing Google Calendar token:', error);
      throw new Error('Failed to refresh Google Calendar token');
    }
  }
}

// Helper functions for database operations
export async function getGoogleCalendarTokens(clerkUserId: string): Promise<GoogleCalendarToken | null> {
  try {
    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: data.expires_at,
      scope: data.scope,
    };
  } catch (error) {
    console.error('Error fetching Google Calendar tokens:', error);
    return null;
  }
}

export async function saveGoogleCalendarTokens(
  clerkUserId: string,
  tokens: GoogleCalendarToken
): Promise<void> {
  try {
      console.log('Attempting to save tokens for user:', clerkUserId);
  console.log('Token data:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    hasValidTokenType: !!tokens.token_type
  });

    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        clerk_user_id: clerkUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_at: tokens.expires_at,
        scope: tokens.scope,
      });

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log('Tokens saved successfully!');
  } catch (error) {
    console.error('Error saving Google Calendar tokens:', error);
    throw new Error('Failed to save Google Calendar tokens');
  }
}

export async function deleteGoogleCalendarTokens(clerkUserId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting Google Calendar tokens:', error);
    throw new Error('Failed to delete Google Calendar tokens');
  }
}

// Main function to get Google Calendar service for the current user
export async function getGoogleCalendarService(): Promise<GoogleCalendarService | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const tokens = await getGoogleCalendarTokens(userId);
    if (!tokens) {
      return null;
    }

    return new GoogleCalendarService(tokens);
  } catch (error) {
    console.error('Error creating Google Calendar service:', error);
    return null;
  }
} 
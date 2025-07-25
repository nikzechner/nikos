import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGoogleCalendarService } from '@/lib/google-calendar';
import { CalendarItem } from '@/types/calendar';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const googleCalendarService = await getGoogleCalendarService();
    if (!googleCalendarService) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const googleEvents = await googleCalendarService.getUpcomingEvents();
    
    // Convert Google Calendar events to our CalendarItem format
    const calendarEvents: CalendarItem[] = googleEvents.map(event => {
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      return {
        id: `google_${event.id}`,
        title: event.summary || 'Untitled Event',
        start: startTime || new Date().toISOString(),
        end: endTime || new Date(Date.now() + 3600000).toISOString(), // Default 1 hour
        type: 'event' as const,
        googleEventId: event.id,
        isGoogleEvent: true,
        description: event.description,
      };
    });

    return NextResponse.json({ events: calendarEvents });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch Google Calendar events' }, { status: 500 });
  }
} 
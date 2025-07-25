import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGoogleCalendarService } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, eventData } = body;

    const googleCalendarService = await getGoogleCalendarService();
    if (!googleCalendarService) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'create':
        result = await googleCalendarService.createEvent({
          summary: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
        });
        break;

      case 'update':
        if (!eventData.googleEventId) {
          return NextResponse.json({ error: 'Google Event ID required for update' }, { status: 400 });
        }
        result = await googleCalendarService.updateEvent(eventData.googleEventId, {
          summary: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
        });
        break;

      case 'delete':
        if (!eventData.googleEventId) {
          return NextResponse.json({ error: 'Google Event ID required for delete' }, { status: 400 });
        }
        await googleCalendarService.deleteEvent(eventData.googleEventId);
        result = { success: true };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to sync with Google Calendar' }, { status: 500 });
  }
} 
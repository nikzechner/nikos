import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteGoogleCalendarTokens } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete tokens from database
    await deleteGoogleCalendarTokens(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
} 
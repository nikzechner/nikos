import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');

    if (!habitId) {
      return NextResponse.json({ error: 'habit_id is required' }, { status: 400 });
    }

    const { data: habitLogs, error } = await supabaseServer
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching habit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch habit logs' }, { status: 500 });
    }

    return NextResponse.json({ habitLogs });
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch habit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const habitLogData = {
      ...body,
      user_id: userId, // Ensure user_id is set to authenticated user
    };

    const { data: habitLog, error } = await supabaseServer
      .from('habit_logs')
      .insert([habitLogData])
      .select()
      .single();

    if (error) {
      console.error('Error creating habit log:', error);
      return NextResponse.json({ error: 'Failed to create habit log' }, { status: 500 });
    }

    return NextResponse.json({ habitLog });
  } catch (error) {
    console.error('Error creating habit log:', error);
    return NextResponse.json({ error: 'Failed to create habit log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const completedAt = searchParams.get('completed_at');

    if (!habitId || !completedAt) {
      return NextResponse.json({ error: 'habit_id and completed_at are required' }, { status: 400 });
    }

    // Parse the date to get the day range
    const targetDate = new Date(completedAt);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { error } = await supabaseServer
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .gte('completed_at', startOfDay.toISOString())
      .lte('completed_at', endOfDay.toISOString());

    if (error) {
      console.error('Error deleting habit log:', error);
      return NextResponse.json({ error: 'Failed to delete habit log' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit log:', error);
    return NextResponse.json({ error: 'Failed to delete habit log' }, { status: 500 });
  }
} 
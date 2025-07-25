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
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : undefined;

    let query = supabaseServer
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    }

    const { data: journalEntries, error } = await query;

    if (error) {
      console.error('Error fetching journal entries:', error);
      return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
    }

    return NextResponse.json({ journalEntries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const journalData = {
      ...body,
      user_id: userId, // Ensure user_id is set to authenticated user
    };

    const { data: journalEntry, error } = await supabaseServer
      .from('journal_entries')
      .insert([journalData])
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
    }

    return NextResponse.json({ journalEntry });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
} 
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
      .from('quick_notes')
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

    const { data: quickNotes, error } = await query;
    
    if (error) {
      console.error('Error fetching quick notes:', error);
      return NextResponse.json({ error: 'Failed to fetch quick notes' }, { status: 500 });
    }

    return NextResponse.json({ quickNotes });
  } catch (error) {
    console.error('Error fetching quick notes:', error);
    return NextResponse.json({ error: 'Failed to fetch quick notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Quick note request body:', body);
    
    const noteData = {
      ...body,
      user_id: userId, // Ensure user_id is set to authenticated user
    };
    
    console.log('Quick note data to insert:', noteData);

    const { data: quickNote, error } = await supabaseServer
      .from('quick_notes')
      .insert([noteData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to create quick note', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ quickNote });
  } catch (error) {
    console.error('Detailed error creating quick note:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to create quick note', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
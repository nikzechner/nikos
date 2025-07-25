import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: habits, error } = await supabaseServer
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }

    return NextResponse.json({ habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const habitData = {
      ...body,
      user_id: userId, // Ensure user_id is set to authenticated user
    };

    const { data: habit, error } = await supabaseServer
      .from('habits')
      .insert([habitData])
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
    }

    return NextResponse.json({ habit });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
} 
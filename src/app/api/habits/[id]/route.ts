import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habitId = params.id;
    const body = await request.json();

    // Verify the habit belongs to the authenticated user
    const { data: existingHabit, error: fetchError } = await supabaseServer
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingHabit) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    const habitData = {
      ...body,
      user_id: userId, // Ensure user_id cannot be changed
    };

    const { data: habit, error } = await supabaseServer
      .from('habits')
      .update(habitData)
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
    }

    return NextResponse.json({ habit });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habitId = params.id;

    // Verify the habit belongs to the authenticated user and delete
    const { error } = await supabaseServer
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting habit:', error);
      return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
} 
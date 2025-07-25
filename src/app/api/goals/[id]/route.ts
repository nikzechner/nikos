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

    const goalId = params.id;
    const body = await request.json();

    // Verify the goal belongs to the authenticated user
    const { data: existingGoal, error: fetchError } = await supabaseServer
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    const goalData = {
      ...body,
      user_id: userId, // Ensure user_id cannot be changed
    };

    const { data: goal, error } = await supabaseServer
      .from('goals')
      .update(goalData)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
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

    const goalId = params.id;

    // Verify the goal belongs to the authenticated user and delete
    const { error } = await supabaseServer
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
} 
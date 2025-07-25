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

    const noteId = params.id;
    const body = await request.json();

    // Verify the quick note belongs to the authenticated user
    const { data: existingNote, error: fetchError } = await supabaseServer
      .from('quick_notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Quick note not found or unauthorized' }, { status: 404 });
    }

    const noteData = {
      ...body,
      user_id: userId, // Ensure user_id cannot be changed
    };

    const { data: quickNote, error } = await supabaseServer
      .from('quick_notes')
      .update(noteData)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating quick note:', error);
      return NextResponse.json({ error: 'Failed to update quick note' }, { status: 500 });
    }

    return NextResponse.json({ quickNote });
  } catch (error) {
    console.error('Error updating quick note:', error);
    return NextResponse.json({ error: 'Failed to update quick note' }, { status: 500 });
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

    const noteId = params.id;

    // Verify the quick note belongs to the authenticated user and delete
    const { error } = await supabaseServer
      .from('quick_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting quick note:', error);
      return NextResponse.json({ error: 'Failed to delete quick note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick note:', error);
    return NextResponse.json({ error: 'Failed to delete quick note' }, { status: 500 });
  }
} 
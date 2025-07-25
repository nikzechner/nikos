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

    const entryId = params.id;
    const body = await request.json();

    // Verify the journal entry belongs to the authenticated user
    const { data: existingEntry, error: fetchError } = await supabaseServer
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found or unauthorized' }, { status: 404 });
    }

    const entryData = {
      ...body,
      user_id: userId, // Ensure user_id cannot be changed
    };

    const { data: journalEntry, error } = await supabaseServer
      .from('journal_entries')
      .update(entryData)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating journal entry:', error);
      return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
    }

    return NextResponse.json({ journalEntry });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
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

    const entryId = params.id;

    // Verify the journal entry belongs to the authenticated user and delete
    const { error } = await supabaseServer
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting journal entry:', error);
      return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
  }
} 
import { supabase } from '../supabase';
import type { Database } from '../database.types';

export const getJournalEntries = async (userId: string, date?: Date) => {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching journal entries:', error.message)
    throw error
  }
  return data
}

export const createJournalEntry = async (entry: Database['public']['Tables']['journal_entries']['Insert']) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([entry])
    .select()
  
  if (error) {
    console.error('Error creating journal entry:', error.message)
    throw error
  }
  return data[0]
}

export const updateJournalEntry = async (id: string, updates: Partial<Database['public']['Tables']['journal_entries']['Update']>) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating journal entry:', error.message)
    throw error
  }
  return data[0]
}

export const getJournalEntryById = async (id: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching journal entry by ID:', error.message)
    throw error
  }
  return data
}

export const deleteJournalEntry = async (id: string) => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting journal entry:', error.message)
    throw error
  }
}

export const getMoodData = async (userId: string, startDate?: Date, endDate?: Date) => {
  let query = supabase
    .from('journal_entries')
    .select('created_at, mood, mood_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching mood data:', error.message)
    throw error
  }
  return data
} 
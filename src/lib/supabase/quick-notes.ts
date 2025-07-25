import { supabase } from '../supabase';
import type { Database } from '../database.types';

export const getQuickNotes = async (userId: string, date?: Date) => {
  let query = supabase
    .from('quick_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    query = query
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching quick notes:', error.message)
    throw error
  }
  return data
}

export const createQuickNote = async (note: Database['public']['Tables']['quick_notes']['Insert']) => {
  const { data, error } = await supabase
    .from('quick_notes')
    .insert([note])
    .select()
  
  if (error) {
    console.error('Error creating quick note:', error.message)
    throw error
  }
  return data[0]
}

export const updateQuickNote = async (id: string, updates: Partial<Database['public']['Tables']['quick_notes']['Update']>) => {
  const { data, error } = await supabase
    .from('quick_notes')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating quick note:', error.message)
    throw error
  }
  return data[0]
}

export const getQuickNoteById = async (id: string) => {
  const { data, error } = await supabase
    .from('quick_notes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching quick note by ID:', error.message)
    throw error
  }
  return data
}

export const deleteQuickNote = async (id: string) => {
  const { error } = await supabase
    .from('quick_notes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting quick note:', error.message)
    throw error
  }
} 
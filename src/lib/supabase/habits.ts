import { supabase } from '../supabase';
import type { Database } from '../database.types';

export const getHabits = async (userId: string) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching habits:', error.message)
    throw error
  }
  return data
}

export const createHabit = async (habit: Database['public']['Tables']['habits']['Insert']) => {
  const { data, error } = await supabase
    .from('habits')
    .insert([habit])
    .select()
  
  if (error) {
    console.error('Error creating habit:', error.message)
    throw error
  }
  return data[0]
}

export const updateHabit = async (id: string, updates: Partial<Database['public']['Tables']['habits']['Update']>) => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating habit:', error.message)
    throw error
  }
  return data[0]
}

export const logHabitCompletion = async (habitLog: Database['public']['Tables']['habit_logs']['Insert']) => {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert([habitLog])
    .select()
  
  if (error) {
    console.error('Error logging habit completion:', error.message)
    throw error
  }
  return data[0]
}

export const getHabitById = async (id: string) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching habit by ID:', error.message)
    throw error
  }
  return data
}

export const deleteHabit = async (id: string) => {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting habit:', error.message)
    throw error
  }
}

export const getHabitLogs = async (habitId: string) => {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .order('completed_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching habit logs:', error.message)
    throw error
  }
  return data
} 
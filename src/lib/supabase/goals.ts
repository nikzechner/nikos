import { supabase } from '../supabase';
import type { Database } from '../database.types';

export const getGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching goals:', error.message)
    throw error
  }
  return data
}

export const createGoal = async (goal: Database['public']['Tables']['goals']['Insert']) => {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()
  
  if (error) {
    console.error('Error creating goal:', error.message)
    throw error
  }
  return data[0]
}

export const updateGoal = async (id: string, updates: Partial<Database['public']['Tables']['goals']['Update']>) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating goal:', error.message)
    throw error
  }
  return data[0]
}

export const getGoalById = async (id: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching goal by ID:', error.message)
    throw error
  }
  return data
}

export const deleteGoal = async (id: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting goal:', error.message)
    throw error
  }
} 
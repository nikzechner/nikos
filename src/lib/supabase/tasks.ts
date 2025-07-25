import { supabase } from '../supabase';
import type { Database } from '../database.types';

export const getTasks = async (userId: string, date?: Date) => {
  let query = supabase
    .from('tasks')
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
    console.error('Error fetching tasks:', error.message)
    throw error
  }
  return data
}

export const createTask = async (task: Database['public']['Tables']['tasks']['Insert']) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
  
  if (error) {
    console.error('Error creating task:', error.message)
    throw error
  }
  return data[0]
}

export const updateTask = async (id: string, updates: Partial<Database['public']['Tables']['tasks']['Update']>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating task:', error.message)
    throw error
  }
  return data[0]
}

export const getTaskById = async (id: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching task by ID:', error.message)
    throw error
  }
  return data
}

export const deleteTask = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting task:', error.message)
    throw error
  }
} 
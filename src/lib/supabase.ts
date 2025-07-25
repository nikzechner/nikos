import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error.message)
    return null
  }
  return user
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error.message)
    return null
  }
  return session
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) {
    console.error('Error signing in:', error.message)
    throw error
  }
  return data
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) {
    console.error('Error signing up:', error.message)
    throw error
  }
  return data
}

// User profile functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error.message)
    throw error
  }
  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
  
  if (error) {
    console.error('Error updating user profile:', error.message)
    throw error
  }
  return data[0]
}

// Goals functions
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

// Habits functions
export const getHabits = async (userId: string, date?: Date) => {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
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

export const deleteHabit = async (id: string) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting habit:', error.message)
    throw error
  }
}

// Habit logs functions
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

// Tasks functions
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

// Journal entries functions
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

// Get mood data for charting (future feature)
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

// Events functions
export const getEvents = async (userId: string, date?: Date) => {
  let query = supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true })
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching events:', error.message)
    throw error
  }
  return data
}

export const createEvent = async (event: Database['public']['Tables']['events']['Insert']) => {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
  
  if (error) {
    console.error('Error creating event:', error.message)
    throw error
  }
  return data[0]
}

export const updateEvent = async (id: string, updates: Partial<Database['public']['Tables']['events']['Update']>) => {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating event:', error.message)
    throw error
  }
  return data[0]
}

export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting event:', error.message)
    throw error
  }
}

// LLM Context functions
export const getLLMContext = async (userId: string, contextType?: string) => {
  let query = supabase
    .from('llm_context')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (contextType) {
    query = query.eq('context_type', contextType)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching LLM context:', error.message)
    throw error
  }
  return data
}

export const createLLMContext = async (context: Database['public']['Tables']['llm_context']['Insert']) => {
  const { data, error } = await supabase
    .from('llm_context')
    .insert([context])
    .select()
  
  if (error) {
    console.error('Error creating LLM context:', error.message)
    throw error
  }
  return data[0]
}

export const updateLLMContext = async (id: string, updates: Partial<Database['public']['Tables']['llm_context']['Update']>) => {
  const { data, error } = await supabase
    .from('llm_context')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating LLM context:', error.message)
    throw error
  }
  return data[0]
}

// Real-time subscriptions
export const subscribeToGoals = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('goals')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'goals',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

export const subscribeToHabits = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('habits')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'habits',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

export const subscribeToTasks = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('tasks')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'tasks',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

// Quick Notes functions
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
    .insert(note)
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
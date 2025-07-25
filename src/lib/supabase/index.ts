// Core Supabase client
export { supabase } from '../supabase';

// Task functions
export {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from './tasks';

// Habit functions
export {
  getHabits,
  createHabit,
  updateHabit,
  logHabitCompletion,
  getHabitLogs
} from './habits';

// Goal functions
export {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from './goals';

// Journal functions
export {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getMoodData
} from './journal';

// Quick Notes functions
export {
  getQuickNotes,
  createQuickNote,
  updateQuickNote,
  deleteQuickNote
} from './quick-notes'; 
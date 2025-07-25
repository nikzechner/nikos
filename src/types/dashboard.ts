export interface Goal {
  id: string;
  title: string;
  timeframe: string;
  status: string;
  is_priority: boolean;
  created_at?: string;
}

export interface Habit {
  id: string;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string | null;
  estimated_duration_minutes?: number | null;
  actual_duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  mood_value: number;
  created_at: string;
  updated_at: string;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
  created_at: string;
}

// Dialog states
export interface DialogStates {
  showSettingsDialog: boolean;
  showCompletedTasks: boolean;
  showGoalDialog: boolean;
  showNoteDialog: boolean;
  showHabitDialog: boolean;
}

// Form states
export interface FormStates {
  newTodo: string;
  journalEntry: string;
  journalMood: string;
  notes: string;
  newGoalTitle: string;
  newGoalTimeframe: string;
  newGoalStatus: string;
  newGoalPriority: boolean;
  editingNote: string;
  noteTags: string;
  noteGoalId: string;
  newHabitTitle: string;
}

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}; 
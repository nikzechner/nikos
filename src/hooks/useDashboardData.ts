import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  tasksApi, 
  goalsApi, 
  habitsApi, 
  journalApi, 
  quickNotesApi,
  habitLogsApi,
  showErrorToast 
} from '@/lib/api-client';
import type { Task, Goal, Habit, JournalEntry, QuickNote } from '@/types/dashboard';

export function useDashboardData(selectedDate: Date) {
  const { user, isLoaded } = useUser();
  
  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  
  // Loading states for different sections
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isLoaded || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data for the selected date with proper error handling
      const [tasksResult, journalResult, goalsResult, habitsResult, notesResult] = await Promise.all([
        tasksApi.getAll(selectedDate),
        journalApi.getAll(selectedDate),
        goalsApi.getAll(),
        habitsApi.getAll(),
        quickNotesApi.getAll(selectedDate)
      ]);

      // Handle individual errors but continue with successful requests
      let hasErrors = false;

      if (tasksResult.error) {
        console.error('Tasks error:', tasksResult.error);
        showErrorToast(tasksResult.error);
        hasErrors = true;
      } else {
        setTasks(tasksResult.data || []);
      }

      if (journalResult.error) {
        console.error('Journal error:', journalResult.error);
        showErrorToast(journalResult.error);
        hasErrors = true;
      } else {
        setJournalEntries(journalResult.data || []);
      }

      if (goalsResult.error) {
        console.error('Goals error:', goalsResult.error);
        showErrorToast(goalsResult.error);
        hasErrors = true;
      } else {
        setGoals(goalsResult.data || []);
      }

      if (notesResult.error) {
        console.error('Notes error:', notesResult.error);
        showErrorToast(notesResult.error);
        hasErrors = true;
      } else {
        setQuickNotes(notesResult.data || []);
      }

      // Handle habits with special processing
      if (habitsResult.error) {
        console.error('Habits error:', habitsResult.error);
        showErrorToast(habitsResult.error);
        setHabits([]);
        hasErrors = true;
      } else {
        // Process habits to include streak information and selected date's completion status
        try {
          const processedHabits = await Promise.all(
            (habitsResult.data || []).map(async (habit) => {
              try {
                const logsResult = await habitLogsApi.getByHabitId(habit.id);
                const logs = logsResult.data || [];
                const selectedDateStart = new Date(selectedDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                
                // Check if completed on the selected date
                const completedOnSelectedDate = logs.some((log: any) => {
                  const logDate = new Date(log.completed_at);
                  logDate.setHours(0, 0, 0, 0);
                  return logDate.getTime() === selectedDateStart.getTime();
                });

                return {
                  ...habit,
                  completed_today: completedOnSelectedDate,
                  current_streak: habit.current_streak || 0,
                  longest_streak: habit.longest_streak || 0
                };
              } catch (logError) {
                console.error('Error processing habit logs:', logError);
                // Return habit without completion status if logs fail
                return {
                  ...habit,
                  completed_today: false,
                  current_streak: habit.current_streak || 0,
                  longest_streak: habit.longest_streak || 0
                };
              }
            })
          );

          setHabits(processedHabits);
        } catch (processError) {
          console.error('Error processing habits:', processError);
          setHabits(habitsResult.data || []);
          showErrorToast('Failed to load habit completion status');
        }
      }

      // Only set general error if all requests failed
      if (hasErrors && !tasksResult.data && !journalResult.data && !goalsResult.data && !habitsResult.data && !notesResult.data) {
        setError('Failed to load dashboard data. Please try refreshing the page.');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
      showErrorToast('Failed to load dashboard data');
      
      // Fallback to empty arrays if there's a general error
      setTasks([]);
      setJournalEntries([]);
      setGoals([]);
      setHabits([]);
      setQuickNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user is loaded or selected date changes
  useEffect(() => {
    fetchAllData();
  }, [isLoaded, user, selectedDate]);

  // Individual section loaders with error handling
  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const result = await tasksApi.getAll(selectedDate);
      if (result.error) {
        showErrorToast(result.error);
      } else {
        setTasks(result.data || []);
      }
    } finally {
      setTasksLoading(false);
    }
  };

  const loadGoals = async () => {
    setGoalsLoading(true);
    try {
      const result = await goalsApi.getAll();
      if (result.error) {
        showErrorToast(result.error);
      } else {
        setGoals(result.data || []);
      }
    } finally {
      setGoalsLoading(false);
    }
  };

  const loadHabits = async () => {
    setHabitsLoading(true);
    try {
      const result = await habitsApi.getAll();
      if (result.error) {
        showErrorToast(result.error);
        setHabits([]);
      } else {
        // Process habits with completion status
        const processedHabits = await Promise.all(
          (result.data || []).map(async (habit) => {
            try {
              const logsResult = await habitLogsApi.getByHabitId(habit.id);
              const logs = logsResult.data || [];
              const selectedDateStart = new Date(selectedDate);
              selectedDateStart.setHours(0, 0, 0, 0);
              
              const completedOnSelectedDate = logs.some((log: any) => {
                const logDate = new Date(log.completed_at);
                logDate.setHours(0, 0, 0, 0);
                return logDate.getTime() === selectedDateStart.getTime();
              });

              return {
                ...habit,
                completed_today: completedOnSelectedDate,
                current_streak: habit.current_streak || 0,
                longest_streak: habit.longest_streak || 0
              };
            } catch {
              return {
                ...habit,
                completed_today: false,
                current_streak: habit.current_streak || 0,
                longest_streak: habit.longest_streak || 0
              };
            }
          })
        );
        setHabits(processedHabits);
      }
    } finally {
      setHabitsLoading(false);
    }
  };

  const loadJournal = async () => {
    setJournalLoading(true);
    try {
      const result = await journalApi.getAll(selectedDate);
      if (result.error) {
        showErrorToast(result.error);
      } else {
        setJournalEntries(result.data || []);
      }
    } finally {
      setJournalLoading(false);
    }
  };

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const result = await quickNotesApi.getAll(selectedDate);
      if (result.error) {
        showErrorToast(result.error);
      } else {
        setQuickNotes(result.data || []);
      }
    } finally {
      setNotesLoading(false);
    }
  };

  return {
    // Data
    goals,
    setGoals,
    habits,
    setHabits,
    tasks,
    setTasks,
    journalEntries,
    setJournalEntries,
    quickNotes,
    setQuickNotes,
    
    // Loading states
    loading,
    tasksLoading,
    goalsLoading,
    habitsLoading,
    journalLoading,
    notesLoading,
    
    // Error state
    error,
    
    // Refresh functions
    refetch: fetchAllData,
    refreshTasks: loadTasks,
    refreshGoals: loadGoals,
    refreshHabits: loadHabits,
    refreshJournal: loadJournal,
    refreshNotes: loadNotes,
  };
} 
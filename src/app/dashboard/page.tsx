"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check, Circle, User, Calendar as CalendarIcon, Target, Activity, BookOpen, Plus as PlusIcon, Loader2, ChevronLeft, ChevronRight, Star, Settings, Trophy, Clock, X, Link, Unlink, FileText, ArrowLeft, Video } from "lucide-react";
import { Player } from '@lottiefiles/react-lottie-player';
import { tasksApi, journalApi, goalsApi, habitsApi, quickNotesApi, habitLogsApi, showErrorToast, showSuccessToast } from "@/lib/api-client";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { 
  TaskListSkeleton, 
  GoalsSkeleton, 
  HabitsSkeleton, 
  QuickNotesSkeleton, 
  JournalSkeleton, 
  CalendarSkeleton,
  ErrorState,
  LoadingSpinner,
  DashboardSkeleton,
  DashboardLoadingSkeleton
} from "@/components/ui/loading-skeletons";
import dynamic from "next/dynamic";
import { CalendarItem } from "@/types/calendar";
import { calendarUtils } from "@/components/Calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Calendar = dynamic(() => import("@/components/Calendar"), { ssr: false });

interface Goal {
  id: string;
  title: string;
  timeframe: string;
  status: string;
  is_priority: boolean;
  created_at?: string;
}

interface Habit {
  id: string;
  title: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  created_at?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  estimated_duration_minutes?: number;
}

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  mood_value: number;
  created_at: string;
  updated_at: string;
}

interface QuickNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  

  
  // Use the new date navigation hook
  const {
    selectedDate,
    currentTime,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    formatDate,
    formatTime
  } = useDateNavigation();
  
  // Use the new data hook with loading states and error handling
  const {
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
    loading,
    tasksLoading,
    goalsLoading,
    habitsLoading,
    journalLoading,
    notesLoading,
    error,
    refetch,
    refreshTasks,
    refreshGoals,
    refreshHabits,
    refreshJournal,
    refreshNotes
  } = useDashboardData(selectedDate);
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarItem[]>([]);
  
  // UI states
  const [newTodo, setNewTodo] = useState("");
  const [journalEntry, setJournalEntry] = useState("");
  const [journalMood, setJournalMood] = useState("good");
  const [notes, setNotes] = useState("");
  const [journalSaveTimeout, setJournalSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [journalLastSaved, setJournalLastSaved] = useState<Date | null>(null);
  const [priorityTask, setPriorityTask] = useState<Task | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTimeframe, setNewGoalTimeframe] = useState("month");
  const [newGoalStatus, setNewGoalStatus] = useState("on_track");
  const [newGoalPriority, setNewGoalPriority] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<QuickNote | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteGoalId, setNoteGoalId] = useState("");
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  const isOpeningDialog = useRef(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskStart, setEditingTaskStart] = useState<string>("");
  const [editingTaskLength, setEditingTaskLength] = useState(30);
  // taskListRef = useRef<HTMLDivElement>(null); // Removed

  // Google Calendar connection state
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isConnectingGoogleCalendar, setIsConnectingGoogleCalendar] = useState(false);
  
  // Google Calendar sync state for task dialog
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(false);

  // Calendar settings dialog state
  const [calendarSettingsOpen, setCalendarSettingsOpen] = useState(false);
  const [showNotesListDialog, setShowNotesListDialog] = useState(false);
  const [notesListFilter, setNotesListFilter] = useState<'today' | 'all'>('today');
  const [allQuickNotes, setAllQuickNotes] = useState<QuickNote[]>([]);
  const [showBackButton, setShowBackButton] = useState(false);

  // Next meeting state
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [minutesUntilMeeting, setMinutesUntilMeeting] = useState<number | null>(null);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Check Google Calendar connection status on load
  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      try {
        const response = await fetch('/api/google-calendar/events');
        setIsGoogleCalendarConnected(response.ok);
      } catch (error) {
        console.error('Error checking Google Calendar connection:', error);
        setIsGoogleCalendarConnected(false);
      }
    };

    checkGoogleCalendarConnection();
  }, []);

  // Handle OAuth callback query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('google_calendar_connected') === 'true') {
      setIsGoogleCalendarConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (urlParams.get('google_calendar_error')) {
      const error = urlParams.get('google_calendar_error');
      console.error('Google Calendar OAuth error:', error);
      // You could show a toast notification here
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Google Calendar connection
  const handleConnectGoogleCalendar = async () => {
    try {
      setIsConnectingGoogleCalendar(true);
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to initiate Google Calendar connection');
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      alert('Failed to connect to Google Calendar');
    } finally {
      setIsConnectingGoogleCalendar(false);
    }
  };

  // Handle Google Calendar disconnection
  const handleDisconnectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsGoogleCalendarConnected(false);
        // Refresh calendar events to remove Google events
        // The useEffect will handle this automatically
      } else {
        alert('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      alert('Failed to disconnect Google Calendar');
    }
  };

  // Note: Real-time clock update and data fetching is now handled by the hooks

  // Load existing journal entry for the selected date
  useEffect(() => {
    if (journalEntries.length > 0) {
      const todayEntry = journalEntries.find(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date(selectedDate);
        return entryDate.toDateString() === today.toDateString();
      });

      if (todayEntry) {
        setJournalEntry(todayEntry.content);
        setJournalMood(todayEntry.mood);
        setJournalLastSaved(new Date(todayEntry.updated_at));
      } else {
        setJournalEntry("");
        setJournalMood("good");
        setJournalLastSaved(null);
      }
    } else {
      setJournalEntry("");
      setJournalMood("good");
      setJournalLastSaved(null);
    }
  }, [journalEntries, selectedDate]);

  // Reset dialog opening flag when dialog closes
  useEffect(() => {
    if (!showSettingsDialog) {
      isOpeningDialog.current = false;
    }
  }, [showSettingsDialog]);

  // Add a useEffect to sync calendarEvents with tasks and selectedDate
  useEffect(() => {
    const syncCalendarEvents = async () => {
      // Get local task events
      const taskEvents = tasks
        .filter(task => task.due_date && new Date(task.due_date).toDateString() === selectedDate.toDateString())
        .map(task => {
          let endTime: string;
          if (task.completed_at) {
            // Use the existing completed_at if available
            endTime = task.completed_at;
          } else if (task.estimated_duration_minutes) {
            // Calculate end time from start + duration
            endTime = new Date(new Date(task.due_date!).getTime() + task.estimated_duration_minutes * 60000).toISOString();
          } else {
            // Default to 30 minutes
            endTime = new Date(new Date(task.due_date!).getTime() + 30 * 60000).toISOString();
          }
          
          const calendarEvent = {
            id: task.id,
            title: task.title,
            start: task.due_date!,
            end: endTime,
            type: "task" as const,
            taskId: task.id,
            description: task.description,
          };
          
          return calendarEvent;
        });

      // Fetch Google Calendar events if connected
      let googleEvents: CalendarItem[] = [];
      if (isGoogleCalendarConnected) {
        try {
          const response = await fetch('/api/google-calendar/events');
          if (response.ok) {
            const data = await response.json();
            // Filter Google events for the selected date
            googleEvents = data.events.filter((event: CalendarItem) => 
              new Date(event.start).toDateString() === selectedDate.toDateString()
            );
          }
        } catch (error) {
          console.error('Error fetching Google Calendar events:', error);
        }
      }

      // Merge local task events and Google events
      const allEvents = [...taskEvents, ...googleEvents];
      setCalendarEvents(allEvents);
    };

    syncCalendarEvents();
  }, [tasks, selectedDate, isGoogleCalendarConnected]);

  // Note: Date navigation functions are now provided by the useDateNavigation hook

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, status: goal.status === 'achieved' ? 'on_track' : 'achieved' } : goal
    ));
  };

  const toggleHabit = async (id: string) => {
    if (!user) return;

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);

      if (habit.completed_today) {
        // Remove completion for the selected date
        const deleteResult = await habitLogsApi.delete(habit.id, selectedDate.toISOString());
        
        if (deleteResult.error) {
          showErrorToast(deleteResult.error);
          return;
        }

        // Update local state
        setHabits(habits.map(h => 
          h.id === id ? { ...h, completed_today: false } : h
        ));
      } else {
        // Add completion for the selected date
        const createResult = await habitLogsApi.create({
          habit_id: habit.id,
          completed_at: selectedDate.toISOString()
        });

        if (createResult.error) {
          showErrorToast(createResult.error);
          return;
        }

        // Recalculate streak based on consecutive days
        const logsResult = await habitLogsApi.getByHabitId(habit.id);
        
        if (logsResult.error) {
          showErrorToast(logsResult.error);
          return;
        }

        const logs = logsResult.data || [];
        const sortedLogs = logs.sort((a: any, b: any) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );

        // Calculate current streak (consecutive days from most recent)
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedLogs.length; i++) {
          const logDate = new Date(sortedLogs[i].completed_at);
          logDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);
          
          if (logDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }

        const newLongestStreak = Math.max(habit.longest_streak, currentStreak);

        // Update habit with new streak information
        const updateResult = await habitsApi.update(habit.id, {
          current_streak: currentStreak,
          longest_streak: newLongestStreak
        });

        if (updateResult.error) {
          showErrorToast(updateResult.error);
          return;
        }

        // Update local state
        setHabits(habits.map(h => 
          h.id === id ? { 
            ...h, 
            completed_today: true,
            current_streak: currentStreak,
            longest_streak: newLongestStreak
          } : h
        ));
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      showErrorToast('Failed to toggle habit. Please try again.');
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updates = {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      };

      const result = await tasksApi.update(taskId, updates);
      
      if (result.error) {
        showErrorToast(result.error);
        return;
      }
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completed_at: updates.completed_at as string | null }
          : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      showErrorToast('Failed to update task');
    }
  };

  const addTodo = async () => {
    if (!user || !newTodo.trim()) return;

    try {
      const result = await tasksApi.create({
        title: newTodo.trim(),
        status: 'pending',
        priority: 'medium'
      });

      if (result.error) {
        showErrorToast(result.error);
        return;
      }

      if (result.data) {
        setTasks([result.data, ...tasks]);
        setNewTodo("");
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showErrorToast('Failed to create task. Please try again.');
    }
  };

  const deleteTodo = async (taskId: string) => {
    if (!user) return;

    try {
      const result = await tasksApi.delete(taskId);
      
      if (result.error) {
        showErrorToast(result.error);
        return;
      }
      
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      showErrorToast('Failed to delete task');
    }
  };

  const saveJournalEntry = async () => {
    if (!user) return;

    try {
      // Get mood value based on selection
      const moodValues: { [key: string]: number } = {
        'bad': -3,
        'okay': 0,
        'good': 3,
        'awesome': 5
      };

      const moodValue = moodValues[journalMood] || 0;

      // Check if there's already an entry for today
      const todayEntry = journalEntries.find(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date(selectedDate);
        return entryDate.toDateString() === today.toDateString();
      });

      if (todayEntry) {
        // Update existing entry
        const result = await journalApi.update(todayEntry.id, {
          content: journalEntry.trim() || '',
          mood: journalMood,
          mood_value: moodValue
        });

        if (result.error) {
          showErrorToast(result.error);
          return;
        }

        if (result.data) {
          setJournalEntries(journalEntries.map(entry => 
            entry.id === todayEntry.id ? result.data : entry
          ));
        }
      } else {
        // Create new entry
        const result = await journalApi.create({
          content: journalEntry.trim() || '',
          mood: journalMood,
          mood_value: moodValue
        });

        if (result.error) {
          showErrorToast(result.error);
          return;
        }

        if (result.data) {
          setJournalEntries([result.data, ...journalEntries]);
        }
      }

      setJournalLastSaved(new Date());
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
    }
  };

  // Debounced auto-save function
  const debouncedSaveJournal = (content: string, mood: string) => {
    if (journalSaveTimeout) {
      clearTimeout(journalSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      if (!user) return;

      try {
        const moodValues: { [key: string]: number } = {
          'bad': -3,
          'okay': 0,
          'good': 3,
          'awesome': 5
        };

        const moodValue = moodValues[mood] || 0;

        // Check if there's already an entry for today
        const todayEntry = journalEntries.find(entry => {
          const entryDate = new Date(entry.created_at);
          const today = new Date(selectedDate);
          return entryDate.toDateString() === today.toDateString();
        });

        if (todayEntry) {
          // Update existing entry
          const result = await journalApi.update(todayEntry.id, {
            content: content.trim() || '',
            mood: mood,
            mood_value: moodValue
          });

          if (result.error) {
            console.error('Auto-save error:', result.error);
            return;
          }

          if (result.data) {
            setJournalEntries(journalEntries.map(entry => 
              entry.id === todayEntry.id ? result.data : entry
            ));
          }
        } else {
          // Create new entry
          const result = await journalApi.create({
            content: content.trim() || '',
            mood: mood,
            mood_value: moodValue
          });

          if (result.error) {
            console.error('Auto-save error:', result.error);
            return;
          }

          if (result.data) {
            setJournalEntries([result.data, ...journalEntries]);
          }
        }

        setJournalLastSaved(new Date());
      } catch (error) {
        console.error('Error auto-saving journal entry:', error);
      }
    }, 2000); // Save after 2 seconds of inactivity

    setJournalSaveTimeout(timeout);
  };

  // Priority task functions
  const setTaskAsPriority = (task: Task) => {
    if (priorityTask && priorityTask.id !== task.id) {
      // Only allow one priority task at a time
      return;
    }
    setPriorityTask(priorityTask?.id === task.id ? null : task);
  };

  const handlePriorityTaskComplete = async (taskId: string) => {
    if (priorityTask?.id === taskId) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      setPriorityTask(null);
    }
    await toggleTask(taskId);
  };

  const removePriorityTask = () => {
    setPriorityTask(null);
  };

  // Goal management functions
  const handleCreateGoal = async () => {
    if (!user || !newGoalTitle.trim()) return;

    try {
      const result = await goalsApi.create({
        title: newGoalTitle.trim(),
        timeframe: newGoalTimeframe,
        status: newGoalStatus,
        is_priority: newGoalPriority
      });

      if (result.error) {
        showErrorToast(result.error);
        return;
      }

      if (result.data) {
        setGoals([result.data, ...goals]);
        setNewGoalTitle("");
        setNewGoalTimeframe("month");
        setNewGoalStatus("on_track");
        setNewGoalPriority(false);
        setShowGoalDialog(false);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      showErrorToast('Failed to create goal. Please try again.');
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, newStatus: string) => {
    if (!user) return;

    try {
      const result = await goalsApi.update(goalId, { status: newStatus });
      if (result.error) {
        showErrorToast(result.error);
        return;
      }
      
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, status: newStatus } : goal
      ));
    } catch (error) {
      console.error('Error updating goal:', error);
      showErrorToast('Failed to update goal status. Please try again.');
    }
  };

  const handleSetGoalAsPriority = async (goalId: string) => {
    if (!user) return;

    try {
      // First, remove priority from all other goals
      const updatePromises = goals.map(goal => 
        goalsApi.update(goal.id, { is_priority: goal.id === goalId })
      );
      
      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const failedUpdates = results.filter(result => result.error);
      if (failedUpdates.length > 0) {
        showErrorToast('Failed to update goal priorities. Please try again.');
        return;
      }

      // Update local state
      setGoals(goals.map(goal => ({
        ...goal,
        is_priority: goal.id === goalId
      })));
    } catch (error) {
      console.error('Error updating goal priority:', error);
    }
  };

  // Quick Notes functions
  const handleCreateQuickNote = async () => {
    if (!user || !notes.trim()) return;

    try {
      const result = await quickNotesApi.create({
        title: notes.trim().substring(0, 50) + (notes.trim().length > 50 ? '...' : ''),
        content: notes.trim(),
        tags: [],
        goal_id: null
      });

      if (result.error) {
        showErrorToast(result.error);
        return;
      }

      if (result.data) {
        setQuickNotes([result.data, ...quickNotes]);
        setNotes("");
      }
    } catch (error) {
      console.error('Error creating quick note:', error);
      showErrorToast('Failed to create note. Please try again.');
    }
  };

  // Notes list dialog functions
  const openNotesListDialog = async () => {
    if (!user) return;
    
    try {
      // Fetch all notes (not filtered by date)
      const result = await quickNotesApi.getAll();
      if (result.error) {
        showErrorToast(result.error);
        return;
      }
      setAllQuickNotes(result.data || []);
      setShowNotesListDialog(true);
    } catch (error) {
      console.error('Error fetching all notes:', error);
      showErrorToast('Failed to load notes');
    }
  };

  const openNoteFromList = (note: any) => {
    setSelectedNote(note);
    setEditingNote(note.content);
    setNoteTags(note.tags.join(', '));
    setNoteGoalId(note.goal_id || '');
    setShowBackButton(true);
    setShowNotesListDialog(false);
    setShowNoteDialog(true);
  };

  const goBackToNotesList = () => {
    setShowNoteDialog(false);
    setShowBackButton(false);
    setShowNotesListDialog(true);
  };

  // Filter notes based on selected filter
  const getFilteredNotes = () => {
    if (notesListFilter === 'today') {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      return allQuickNotes.filter(note => {
        const noteDate = new Date(note.created_at);
        return noteDate >= startOfDay && noteDate <= endOfDay;
      });
    }
    return allQuickNotes;
  };

  // Next meeting functions
  const findNextMeeting = useCallback(() => {
    const now = new Date();
    const upcomingEvents = calendarEvents
      .filter(event => {
        const eventStart = new Date(event.start);
        return eventStart > now;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      setNextMeeting(nextEvent);
      
      // Calculate minutes until meeting
      const eventStart = new Date(nextEvent.start);
      const minutesUntil = Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60));
      setMinutesUntilMeeting(minutesUntil);
    } else {
      setNextMeeting(null);
      setMinutesUntilMeeting(null);
    }
  }, [calendarEvents]);

  const formatTimeUntilMeeting = (minutes: number) => {
    if (minutes < 0) return "Meeting started";
    if (minutes === 0) return "Starting now";
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const isGoogleMeeting = (event: any) => {
    if (!event) return false;
    const description = event.description || '';
    const title = event.title || '';
    
    return (
      event.isGoogleEvent ||
      description.includes('meet.google.com') ||
      description.includes('zoom.us') ||
      title.toLowerCase().includes('meeting') ||
      title.toLowerCase().includes('call')
    );
  };

  const getJoinMeetingUrl = (event: any) => {
    if (!event) return null;
    const description = event.description || '';
    
    // Look for Google Meet links
    const meetMatch = description.match(/https:\/\/meet\.google\.com\/[a-z-]+/);
    if (meetMatch) return meetMatch[0];
    
    // Look for Zoom links
    const zoomMatch = description.match(/https:\/\/[a-zA-Z0-9.-]*zoom\.us\/[^\s]+/);
    if (zoomMatch) return zoomMatch[0];
    
    return null;
  };

  const handleCreateHabit = async () => {
    if (!user || !newHabitTitle.trim()) return;

    try {
      const result = await habitsApi.create({
        title: newHabitTitle.trim(),
        current_streak: 0,
        longest_streak: 0,
        is_active: true
      });

      if (result.error) {
        showErrorToast(result.error);
        return;
      }

      if (result.data) {
        setHabits([result.data, ...habits]);
        setNewHabitTitle("");
        setShowHabitDialog(false);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      showErrorToast('Failed to create habit. Please try again.');
    }
  };

  const openNoteDialog = (note: QuickNote) => {
    setSelectedNote(note);
    setEditingNote(note.content);
    setNoteTags(note.tags.join(', '));
    setNoteGoalId(note.goal_id ?? '');
    setShowBackButton(false); // Reset back button when opening directly
    setShowNoteDialog(true);
  };

  const saveNoteChanges = async () => {
    if (!selectedNote) return;

    try {
      const result = await quickNotesApi.update(selectedNote.id, {
        content: editingNote,
        tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        goal_id: noteGoalId || null
      });

      if (result.error) {
        showErrorToast(result.error);
        return;
      }

      if (result.data) {
        setQuickNotes(quickNotes.map(note => 
          note.id === selectedNote.id ? result.data : note
        ));
        setShowNoteDialog(false);
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      showErrorToast('Failed to update note. Please try again.');
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Open dialog and populate fields
  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setEditingTaskTitle(task.title);
    setEditingTaskDescription(task.description || "");
    setEditingTaskStart(task.due_date ? formatDateForInput(task.due_date) : "");
    // Use estimated_duration_minutes if available, otherwise calculate from completed_at, or default to 30
    const calculatedLength = task.estimated_duration_minutes 
      || (task.due_date && task.completed_at 
          ? Math.round((new Date(task.completed_at).getTime() - new Date(task.due_date).getTime()) / 60000)
          : 30);
    setEditingTaskLength(calculatedLength);
    
    // Reset Google Calendar sync checkbox - check if task already has Google sync
    // Note: We would need to add google_event_id to Task interface to track this
    setSyncToGoogleCalendar(false);
    
    setEditTaskDialogOpen(true);
  };

  // Helper function to open dialog by task ID (ensures we get the latest task data)
  const openEditTaskDialogById = useCallback((taskId: string) => {
    const taskToEdit = tasks.find(t => t.id === taskId);
    if (taskToEdit) {
      openEditTaskDialog(taskToEdit);
    }
  }, [tasks]);

  // Handler for clicking on calendar events
  const handleCalendarEventClick = useCallback((eventId: string, eventType: 'event' | 'task') => {
    if (eventType === 'task') {
      // Find the calendar event to get the taskId
      const calendarEvent = calendarEvents.find(e => e.id === eventId);
      if (calendarEvent && calendarEvent.type === 'task' && 'taskId' in calendarEvent && calendarEvent.taskId) {
        openEditTaskDialogById(calendarEvent.taskId);
      }
    }
    // Handle 'event' type clicks here if needed in the future
  }, [calendarEvents, openEditTaskDialogById]);

  // Create a wrapper function to handle calendar event updates
  const handleSetCalendarEvents = useCallback((updater: React.SetStateAction<CalendarItem[]>) => {
    setCalendarEvents(prev => {
      const newEvents = typeof updater === 'function' ? updater(prev) : updater;
      
      // Check for changed events and update corresponding tasks
      newEvents.forEach(event => {
        if (event.type === "task" && "taskId" in event && event.taskId) {
          const prevEvent = prev.find(e => e.id === event.id);
          // Only update if the event has actually changed
          if (!prevEvent || prevEvent.start !== event.start || prevEvent.end !== event.end) {
            const durationMinutes = Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000);
            
            // Update local tasks state with new timing AND duration
            setTasks(prevTasks => prevTasks.map(t => t.id === event.taskId ? {
              ...t,
              due_date: event.start,
              completed_at: event.end,
              estimated_duration_minutes: durationMinutes, // Add this line!
            } : t));
            
            // Update the backend
            tasksApi.update(event.taskId, {
              due_date: event.start,
              completed_at: event.end,
              estimated_duration_minutes: durationMinutes,
            }).then(result => {
              if (result.error) {
                console.error('Failed to update task in backend:', result.error);
                showErrorToast(result.error);
              }
            }).catch((err) => {
              console.error('Failed to update task in backend:', err);
            });
          }
        }
      });
      
      return newEvents;
    });
  }, []);

  // Add handleSaveTask function
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    try {
      setIsSubmittingFeedback(true);
      
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedbackMessage.trim(),
          pageContext: 'Dashboard',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        showSuccessToast('Thank you for your feedback! 🎉');
        setFeedbackMessage("");
        setShowFeedbackModal(false);
      } else {
        const error = await response.text();
        showErrorToast(`Failed to submit feedback: ${error}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showErrorToast('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;
    
    const startTime = editingTaskStart ? new Date(editingTaskStart).toISOString() : undefined;
    const endTime = startTime ? new Date(new Date(startTime).getTime() + editingTaskLength * 60000).toISOString() : undefined;
    
    const updatedTask: Task = {
      ...editingTask,
      title: editingTaskTitle,
      description: editingTaskDescription,
      due_date: startTime,
      completed_at: endTime,
    };
    
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // Update backend with time and length
    const updateResult = await tasksApi.update(updatedTask.id, {
      title: updatedTask.title,
      description: updatedTask.description,
      due_date: updatedTask.due_date,
      completed_at: updatedTask.completed_at,
      estimated_duration_minutes: editingTaskLength,
    });
    
    if (updateResult.error) {
      showErrorToast(updateResult.error);
      return;
    }
    
    // Sync to Google Calendar if requested and connected
    if (syncToGoogleCalendar && isGoogleCalendarConnected && startTime && endTime) {
      try {
        await fetch('/api/google-calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            eventData: {
              title: updatedTask.title,
              description: updatedTask.description,
              start: startTime,
              end: endTime,
            },
          }),
        });
      } catch (error) {
        console.error('Error syncing to Google Calendar:', error);
        // Don't block the task save if Google sync fails
      }
    }
    
    // If scheduled for today, update calendar event
    if (updatedTask.due_date && new Date(updatedTask.due_date).toDateString() === selectedDate.toDateString()) {
      setCalendarEvents(prev => {
        const exists = prev.find(e => e.type === "task" && "taskId" in e && e.taskId === updatedTask.id);
        const start = updatedTask.due_date!;
        const end = updatedTask.completed_at || new Date(new Date(updatedTask.due_date!).getTime() + editingTaskLength * 60000).toISOString();
        const newEvent: CalendarItem = {
          id: exists ? exists.id : Math.random().toString(36).slice(2),
          title: updatedTask.title,
          start,
          end,
          type: "task",
          taskId: updatedTask.id,
          description: updatedTask.description,
        };
        if (exists) {
          return prev.map(e => (e.type === "task" && "taskId" in e && e.taskId === updatedTask.id) ? newEvent : e);
        } else {
          return [...prev, newEvent];
        }
      });
    } else {
      // Remove from calendar if not scheduled for today
      setCalendarEvents(prev => prev.filter(e => !(e.type === "task" && "taskId" in e && e.taskId === updatedTask.id)));
    }
    setEditTaskDialogOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Celebration animation component
  const CelebrationAnimation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showCelebration ? 1 : 0 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      <div className="relative">
        {/* Fireworks */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [1, 1, 0],
              x: Math.cos((i * 30) * Math.PI / 180) * 100,
              y: Math.sin((i * 30) * Math.PI / 180) * 100,
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              ease: "easeOut"
            }}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
          />
        ))}
        
        {/* Center celebration */}
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: showCelebration ? 1 : 0, rotate: 360 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-6xl"
        >
          🎉
        </motion.div>
      </div>
    </motion.div>
  );

  // Update next meeting when calendar events change
  useEffect(() => {
    findNextMeeting();
  }, [findNextMeeting]);

  // Set up timer to update countdown every minute
  useEffect(() => {
    if (!nextMeeting) return;

    const timer = setInterval(() => {
      findNextMeeting();
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [nextMeeting, findNextMeeting]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <SignedIn>
        <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-[20px] pt-4 pb-6 flex flex-col">
          {loading ? (
            <DashboardLoadingSkeleton />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1.5fr_1.25fr] gap-3 flex-1 h-full"
            >
              {/* Left Sidebar */}
              <motion.div variants={itemVariants} className="space-y-3 min-w-[340px]">
                {/* Quick Notes Section */}
                <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-slate-500 font-medium tracking-wide">Quick Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea
                      placeholder="Type a quick note and press Enter..."
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey && notes.trim()) {
                          e.preventDefault();
                          handleCreateQuickNote();
                        }
                      }}
                      className="min-h-[80px] resize-none"
                    />

                    {/* Last Note Display with Count Indicator */}
                    {quickNotes.length > 0 && (
                      <div className="flex items-center gap-3 py-2">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer hover:text-slate-700 transition-colors"
                          onClick={() => openNoteDialog(quickNotes[0])}
                        >
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {quickNotes[0].title}
                          </div>
                        </div>
                        
                        {/* Note Count Indicator */}
                        <div className="relative flex-shrink-0">
                          <FileText 
                            className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" 
                            onClick={openNotesListDialog}
                          />
                          {quickNotes.length > 1 && (
                            <motion.div
                              key={quickNotes.length}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 500, 
                                damping: 30,
                                duration: 0.3 
                              }}
                              className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm"
                            >
                              {quickNotes.length}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Todo List */}
                <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs uppercase text-slate-500 font-medium tracking-wide">
                        Tasks for {formatDate(selectedDate)}
                      </CardTitle>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!showSettingsDialog) {
                            setShowSettingsDialog(true);
                          }
                        }}
                        title="Task Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex space-x-1">
                      <Input
                        placeholder="Type a task and press Enter..."
                        value={newTodo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodo(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && newTodo.trim()) {
                            addTodo();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={addTodo} 
                        disabled={!newTodo.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Priority Task Section */}
                    {priorityTask && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 text-amber-500 fill-current" />
                            <span className="text-sm font-bold text-amber-700">⭐ Priority Task</span>
                          </div>
                          <button
                            onClick={removePriorityTask}
                            className="ml-auto text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-all duration-200 p-1 rounded"
                            title="Remove priority"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={priorityTask.status === 'completed'}
                            onCheckedChange={() => handlePriorityTaskComplete(priorityTask.id)}
                            className="data-[state=checked]:bg-amber-600 border-amber-300"
                          />
                          <span className={`text-sm flex-1 font-medium ${priorityTask.status === 'completed' ? 'line-through text-amber-600' : 'text-amber-800'}`}>
                            {priorityTask.title}
                          </span>
                          {priorityTask.status === 'completed' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-amber-600"
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center py-4 text-sm text-slate-500">
                          <div className="mb-2">✨ No tasks for {formatDate(selectedDate)}. Add your first task above!</div>
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 Tip: Type a task and press Enter to add it quickly
                          </div>
                        </div>
                      ) : (
                        tasks
                          .filter(task => !priorityTask || task.id !== priorityTask.id)
                          .filter(task => showCompletedTasks || task.status !== 'completed')
                          .slice(0, 5)
                          .map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
                              onClick={() => openEditTaskDialogById(task.id)}
                            >
                              <Checkbox
                                checked={task.status === 'completed'}
                                onCheckedChange={() => toggleTask(task.id)}
                                className="data-[state=checked]:bg-blue-600"
                              />
                              <span className={`text-sm flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center space-x-1">
                                {task.status === 'completed' && <Check className="w-4 h-4 text-green-600" />}
                                
                                {/* Star button - always visible but subtle */}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`transition-all duration-200 p-1 rounded ${
                                    priorityTask?.id === task.id 
                                      ? 'text-amber-500 bg-amber-50' 
                                      : priorityTask && priorityTask.id !== task.id
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  }`}
                                  onClick={() => setTaskAsPriority(task)}
                                  disabled={!!(priorityTask && priorityTask.id !== task.id)}
                                  title={priorityTask && priorityTask.id !== task.id ? "Only one priority task allowed" : priorityTask?.id === task.id ? "Remove priority" : "Set as priority"}
                                >
                                  <Star className={`w-4 h-4 ${priorityTask?.id === task.id ? 'fill-current' : ''}`} />
                                </motion.button>
                                
                                <button
                                  onClick={() => deleteTodo(task.id)}
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 p-1 rounded"
                                  title="Delete task"
                                >
                                  ×
                                </button>
                              </div>
                            </motion.div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Journal */}
                <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-slate-500 font-medium tracking-wide">
                      Journal for {formatDate(selectedDate)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      {/* Mood Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">How are you feeling today?</label>
                        <select
                          value={journalMood}
                          onChange={(e) => {
                            const newMood = e.target.value;
                            setJournalMood(newMood);
                            debouncedSaveJournal(journalEntry, newMood);
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="bad">Bad</option>
                          <option value="okay">Okay</option>
                          <option value="good">Good</option>
                          <option value="awesome">Awesome</option>
                        </select>
                      </div>
                      
                      {/* Journal Text */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Your thoughts</label>
                        <Textarea
                          placeholder="Write your thoughts for today..."
                          value={journalEntry}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            const newValue = e.target.value;
                            setJournalEntry(newValue);
                            debouncedSaveJournal(newValue, journalMood);
                          }}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                      
                      {/* Save Confirmation */}
                      {journalLastSaved && (
                        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
                          <Check className="w-3 h-3 text-green-600" />
                          <span>Saved {formatTimeAgo(journalLastSaved)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Content */}
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-3">
                {/* Goals Section */}
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-slate-500 font-medium tracking-wide">
                      Your Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {goals.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-500">
                        <div className="mb-3">🎯 No goals yet</div>
                        <Button 
                          onClick={() => setShowGoalDialog(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Goal
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {goals.map((goal) => (
                          <motion.div
                            key={goal.id}
                            whileHover={{ scale: 1.02 }}
                            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                              goal.is_priority 
                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' 
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <Checkbox
                              checked={goal.status === 'achieved'}
                              onCheckedChange={() => toggleGoal(goal.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`${goal.status === 'achieved' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {goal.title}
                                </span>
                                {goal.is_priority && <Trophy className="w-4 h-4 text-amber-500" />}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {goal.timeframe}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  goal.status === 'achieved' ? 'bg-green-100 text-green-700' :
                                  goal.status === 'off_track' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {goal.status === 'achieved' ? 'Achieved' :
                                   goal.status === 'off_track' ? 'Off Track' :
                                   'On Track'}
                                </span>
                              </div>
                            </div>
                            {goal.status === 'achieved' && <Check className="w-4 h-4 text-green-600" />}
                          </motion.div>
                        ))}
                        <Button 
                          onClick={() => setShowGoalDialog(true)}
                          variant="outline"
                          className="w-full mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Goal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lottie Sphere Animation */}
                <div className="flex justify-center py-1">
                  <div className="sphere-container">
                    <Player
                      autoplay
                      loop
                      speed={0.25}
                      src="/lotties/sphere.json"
                      className="max-w-[200px] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Habits Section */}
                <Card className="bg-white/80 backdrop-blur-sm mt-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-xs uppercase text-slate-500 font-medium tracking-wide">
                        Habits for {formatDate(selectedDate)}
                      </span>
                      <Button
                        onClick={() => setShowHabitDialog(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Habit
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {habits.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mb-3">
                          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                          <div className="text-lg font-medium text-slate-600 mb-1">No habits created</div>
                          <div className="text-sm text-slate-500 mb-3">Start building positive routines that stick</div>
                        </div>
                        <Button
                          onClick={() => setShowHabitDialog(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create Habit
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {habits.map((habit) => (
                          <motion.div
                            key={habit.id}
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all duration-200 border border-slate-200"
                          >
                            <Checkbox
                              checked={habit.completed_today}
                              onCheckedChange={() => toggleHabit(habit.id)}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${habit.completed_today ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {habit.title}
                              </span>
                              {habit.current_streak > 0 && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Trophy className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs text-slate-500">
                                    {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''} streak
                                  </span>
                                </div>
                              )}
                            </div>
                            {habit.completed_today && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center space-x-1"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">Done</span>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Sidebar */}
              <motion.div variants={itemVariants} className="space-y-3 min-w-[340px] h-full flex flex-col">
                {/* Calendar Section (now includes date navigation) */}
                <Card className="bg-white/80 backdrop-blur-sm min-w-[340px] flex-1 flex flex-col">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase text-slate-500 font-medium tracking-wide">Calendar</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarSettingsOpen(true)}
                          className="p-1 h-6 w-6"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousDay}
                          className="p-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="text-center min-w-[90px]">
                          <div className="text-sm font-bold text-slate-800">
                            {formatDate(selectedDate)}
                          </div>
                          <div className="text-xs text-slate-600">
                            {formatTime(currentTime)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextDay}
                          className="p-1.5"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Next Meeting Section */}
                  {nextMeeting && (
                    <div className="px-4 pb-3 border-b border-slate-200">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                                Next Meeting
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              {nextMeeting.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-600">
                                {new Date(nextMeeting.start).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              {minutesUntilMeeting !== null && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  in {formatTimeUntilMeeting(minutesUntilMeeting)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Join Meeting Button */}
                          {isGoogleMeeting(nextMeeting) && getJoinMeetingUrl(nextMeeting) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const url = getJoinMeetingUrl(nextMeeting);
                                if (url) window.open(url, '_blank');
                              }}
                              className="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 h-auto text-xs"
                            >
                              <Video className="w-3 h-3 mr-1.5" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <CardContent className="flex-1 p-4 rounded-xl border border-border bg-card shadow-md overflow-hidden min-w-[340px] dark:bg-slate-900">
                    <Calendar date={selectedDate} events={calendarEvents} setEvents={handleSetCalendarEvents} onEventClick={handleCalendarEventClick} />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
        <CelebrationAnimation />
        {showSettingsDialog && (
          <AnimatePresence>
            <motion.div
              key="settings-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowSettingsDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Task Settings</h2>
                    <p className="text-sm text-slate-600">Customize your task experience</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">Show Completed Tasks</h3>
                        <p className="text-sm text-slate-600">Display finished tasks in your list</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        showCompletedTasks ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: showCompletedTasks ? 24 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-end mt-4 pt-3 border-t">
                  <Button
                    onClick={() => setShowSettingsDialog(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Goal Creation Dialog */}
        {showGoalDialog && (
          <AnimatePresence>
            <motion.div
              key="goal-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowGoalDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Create New Goal</h2>
                    <p className="text-sm text-slate-600">Set a new goal to work towards</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Goal Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
                    <Input
                      placeholder="Enter your goal..."
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Timeframe */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                    <select
                      value={newGoalTimeframe}
                      onChange={(e) => setNewGoalTimeframe(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={newGoalStatus}
                      onChange={(e) => setNewGoalStatus(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="on_track">On Track</option>
                      <option value="off_track">Off Track</option>
                      <option value="achieved">Achieved</option>
                    </select>
                  </div>

                  {/* Priority Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">Top Priority</h3>
                        <p className="text-sm text-slate-600">Make this your main focus</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewGoalPriority(!newGoalPriority)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        newGoalPriority ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: newGoalPriority ? 24 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                  <Button
                    onClick={() => setShowGoalDialog(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGoal}
                    disabled={!newGoalTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Goal
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Note Editing Dialog */}
        {showNoteDialog && selectedNote && (
          <AnimatePresence>
            <motion.div
              key="note-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowNoteDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  {showBackButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goBackToNotesList}
                      className="p-2 h-10 w-10 hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Edit Note</h2>
                    <p className="text-sm text-slate-600">Add more details to your note</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Note Content */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Note Content</label>
                    <Textarea
                      placeholder="Write your note content..."
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      className="min-h-[180px] resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
                    <Input
                      placeholder="e.g., marketing, ideas, todo"
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Connect to Goal */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Connect to Goal (Optional)</label>
                    <select
                      value={noteGoalId}
                      onChange={(e) => setNoteGoalId(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No goal selected</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Created Date */}
                  <div className="text-sm text-slate-500">
                    Created: {new Date(selectedNote.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                  <Button
                    onClick={() => setShowNoteDialog(false)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveNoteChanges}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Habit Creation Dialog */}
        {showHabitDialog && (
          <AnimatePresence>
            <motion.div
              key="habit-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowHabitDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Create New Habit</h2>
                    <p className="text-sm text-slate-600">Build a positive routine that sticks</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Habit Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Habit Title</label>
                    <Input
                      placeholder="e.g., Morning Exercise, Read 30 minutes..."
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newHabitTitle.trim()) {
                          handleCreateHabit();
                        }
                      }}
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800 mb-1">How it works</h3>
                        <p className="text-xs text-blue-700">
                          Check off your habit each day to build streaks. The longer your streak, the more motivated you'll be to keep going!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                  <Button
                    onClick={() => setShowHabitDialog(false)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateHabit}
                    disabled={!newHabitTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Habit
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Task Editing Dialog */}
        <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={editingTaskTitle} onChange={e => setEditingTaskTitle(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editingTaskDescription} onChange={e => setEditingTaskDescription(e.target.value)} />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="datetime-local" value={editingTaskStart} onChange={e => setEditingTaskStart(e.target.value)} />
              </div>
              <div>
                <Label>Duration</Label>
                <select 
                  value={editingTaskLength} 
                  onChange={e => setEditingTaskLength(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              {/* Google Calendar Sync Option */}
              {isGoogleCalendarConnected && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sync-google-calendar"
                    checked={syncToGoogleCalendar}
                    onCheckedChange={(checked) => setSyncToGoogleCalendar(checked as boolean)}
                  />
                  <Label htmlFor="sync-google-calendar" className="text-sm">
                    Sync to Google Calendar
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSaveTask}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Calendar Settings Dialog */}
        <Dialog open={calendarSettingsOpen} onOpenChange={setCalendarSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Calendar Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Google Calendar Integration</h3>
                {!isGoogleCalendarConnected ? (
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect your Google Calendar to sync events and view them alongside your tasks.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleConnectGoogleCalendar}
                      disabled={isConnectingGoogleCalendar}
                      className="w-fit"
                    >
                      {isConnectingGoogleCalendar ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Link className="w-4 h-4 mr-2" />
                      )}
                      Connect Google Calendar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Google Calendar Connected</span>
                    </div>
                                         <Button
                       variant="ghost"
                       size="sm"
                       onClick={handleDisconnectGoogleCalendar}
                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                     >
                       <Unlink className="w-3 h-3 mr-1" />
                       Disconnect
                     </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCalendarSettingsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notes List Dialog */}
        {showNotesListDialog && (
          <AnimatePresence>
            <motion.div
              key="notes-list-dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowNotesListDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">All Notes</h2>
                      <p className="text-sm text-slate-600">View and manage your notes</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotesListDialog(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Filter Dropdown */}
                <div className="mb-4">
                  <Select value={notesListFilter} onValueChange={(value: 'today' | 'all') => setNotesListFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today's Notes</SelectItem>
                      <SelectItem value="all">All Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes List */}
                <div className="space-y-2">
                  {getFilteredNotes().length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notes found</p>
                      {notesListFilter === 'today' && (
                        <p className="text-sm mt-1">Try switching to "All Notes" to see older notes</p>
                      )}
                    </div>
                  ) : (
                    getFilteredNotes().map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                        className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all duration-200 border border-slate-200"
                        onClick={() => openNoteFromList(note)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {note.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {note.content.substring(0, 100)}
                              {note.content.length > 100 ? '...' : ''}
                            </div>
                            <div className="text-xs text-slate-400 mt-2">
                              {new Date(note.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-3">
                              {note.tags.slice(0, 2).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="text-xs text-slate-400">+{note.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Feedback Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFeedbackModal(true)}
          className="fixed bottom-16 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          title="Send Feedback"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <AnimatePresence>
            <motion.div
              key="feedback-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowFeedbackModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Send Feedback</h2>
                    <p className="text-sm text-slate-600">Help us improve your experience</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Feedback</label>
                    <Textarea
                      placeholder="Tell us what you think, what you'd like to see, or report any issues..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <Button
                    onClick={() => setShowFeedbackModal(false)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackMessage.trim() || isSubmittingFeedback}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Feedback'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
} 
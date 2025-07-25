// API Client for secure backend routes
// Handles all API calls with proper error handling and loading states

interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading?: boolean;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If parsing JSON fails, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  const data = await response.json();
  return { data };
};

// Tasks API
export const tasksApi = {
  getAll: async (date?: Date): Promise<ApiResponse<any[]>> => {
    try {
      const url = new URL('/api/tasks', window.location.origin);
      if (date) {
        url.searchParams.set('date', date.toISOString());
      }
      
      const response = await fetch(url.toString());
      const result = await handleApiResponse<{ tasks: any[] }>(response);
      return { data: result.data?.tasks || [] };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load tasks. Please try refreshing the page.' 
      };
    }
  },

  create: async (taskData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      
      const result = await handleApiResponse<{ task: any }>(response);
      return { data: result.data?.task };
    } catch (error) {
      console.error('Error creating task:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to create task. Please try again.' 
      };
    }
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const result = await handleApiResponse<{ task: any }>(response);
      return { data: result.data?.task };
    } catch (error) {
      console.error('Error updating task:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to update task. Please try again.' 
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      
      await handleApiResponse<{ success: boolean }>(response);
      return { data: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to delete task. Please try again.' 
      };
    }
  },
};

// Journal API
export const journalApi = {
  getAll: async (date?: Date): Promise<ApiResponse<any[]>> => {
    try {
      const url = new URL('/api/journal', window.location.origin);
      if (date) {
        url.searchParams.set('date', date.toISOString());
      }
      
      const response = await fetch(url.toString());
      const result = await handleApiResponse<{ journalEntries: any[] }>(response);
      return { data: result.data?.journalEntries || [] };
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load journal entries.' 
      };
    }
  },

  create: async (entryData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      
      const result = await handleApiResponse<{ journalEntry: any }>(response);
      return { data: result.data?.journalEntry };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to save journal entry.' 
      };
    }
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const result = await handleApiResponse<{ journalEntry: any }>(response);
      return { data: result.data?.journalEntry };
    } catch (error) {
      console.error('Error updating journal entry:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to update journal entry.' 
      };
    }
  },
};

// Goals API
export const goalsApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch('/api/goals');
      const result = await handleApiResponse<{ goals: any[] }>(response);
      return { data: result.data?.goals || [] };
    } catch (error) {
      console.error('Error fetching goals:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load goals.' 
      };
    }
  },

  create: async (goalData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      
      const result = await handleApiResponse<{ goal: any }>(response);
      return { data: result.data?.goal };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to create goal.' 
      };
    }
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const result = await handleApiResponse<{ goal: any }>(response);
      return { data: result.data?.goal };
    } catch (error) {
      console.error('Error updating goal:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to update goal.' 
      };
    }
  },
};

// Habits API  
export const habitsApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch('/api/habits');
      const result = await handleApiResponse<{ habits: any[] }>(response);
      return { data: result.data?.habits || [] };
    } catch (error) {
      console.error('Error fetching habits:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load habits.' 
      };
    }
  },

  create: async (habitData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });
      
      const result = await handleApiResponse<{ habit: any }>(response);
      return { data: result.data?.habit };
    } catch (error) {
      console.error('Error creating habit:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to create habit.' 
      };
    }
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const result = await handleApiResponse<{ habit: any }>(response);
      return { data: result.data?.habit };
    } catch (error) {
      console.error('Error updating habit:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to update habit.' 
      };
    }
  },
};

// Quick Notes API
export const quickNotesApi = {
  getAll: async (date?: Date): Promise<ApiResponse<any[]>> => {
    try {
      const url = new URL('/api/quick-notes', window.location.origin);
      if (date) {
        url.searchParams.set('date', date.toISOString());
      }
      
      const response = await fetch(url.toString());
      const result = await handleApiResponse<{ quickNotes: any[] }>(response);
      return { data: result.data?.quickNotes || [] };
    } catch (error) {
      console.error('Error fetching quick notes:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load notes.' 
      };
    }
  },

  create: async (noteData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/quick-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      
      const result = await handleApiResponse<{ quickNote: any }>(response);
      return { data: result.data?.quickNote };
    } catch (error) {
      console.error('Error creating quick note:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to create note.' 
      };
    }
  },

  update: async (id: string, updates: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/quick-notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const result = await handleApiResponse<{ quickNote: any }>(response);
      return { data: result.data?.quickNote };
    } catch (error) {
      console.error('Error updating quick note:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to update note.' 
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await fetch(`/api/quick-notes/${id}`, {
        method: 'DELETE',
      });
      
      await handleApiResponse<{ success: boolean }>(response);
      return { data: true };
    } catch (error) {
      console.error('Error deleting quick note:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to delete note.' 
      };
    }
  },
};

// Habit Logs API
export const habitLogsApi = {
  getByHabitId: async (habitId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(`/api/habit-logs?habit_id=${encodeURIComponent(habitId)}`);
      const result = await handleApiResponse<{ habitLogs: any[] }>(response);
      return { data: result.data?.habitLogs || [] };
    } catch (error) {
      console.error('Error fetching habit logs:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to load habit logs.' 
      };
    }
  },

  create: async (logData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      
      const result = await handleApiResponse<{ habitLog: any }>(response);
      return { data: result.data?.habitLog };
    } catch (error) {
      console.error('Error creating habit log:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to log habit completion.' 
      };
    }
  },

  delete: async (habitId: string, completedAt: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await fetch(`/api/habit-logs?habit_id=${encodeURIComponent(habitId)}&completed_at=${encodeURIComponent(completedAt)}`, {
        method: 'DELETE',
      });
      
      await handleApiResponse<{ success: boolean }>(response);
      return { data: true };
    } catch (error) {
      console.error('Error deleting habit log:', error);
      return { 
        error: error instanceof ApiError ? error.message : 'Failed to remove habit completion.' 
      };
    }
  },
};

// Helper function to show user-friendly error toasts
export const showErrorToast = (error: string) => {
  // For now, we'll use a simple alert. In a real app, you'd use a toast library
  console.error('API Error:', error);
  
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
  notification.textContent = error;
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 5000);
};

// Helper function to show success toasts
export const showSuccessToast = (message: string) => {
  console.log('Success:', message);
  
  // Create a simple success notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 5000);
}; 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          timezone: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          status: string
          priority: string
          target_date: string | null
          completed_at: string | null
          progress_percentage: number
          timeframe: string
          is_priority: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          status?: string
          priority?: string
          target_date?: string | null
          completed_at?: string | null
          progress_percentage?: number
          timeframe?: string
          is_priority?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          status?: string
          priority?: string
          target_date?: string | null
          completed_at?: string | null
          progress_percentage?: number
          timeframe?: string
          is_priority?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          frequency: string
          target_count: number
          current_streak: number
          longest_streak: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          frequency?: string
          target_count?: number
          current_streak?: number
          longest_streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          frequency?: string
          target_count?: number
          current_streak?: number
          longest_streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          completed_at: string | null
          estimated_duration_minutes: number | null
          actual_duration_minutes: number | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          estimated_duration_minutes?: number | null
          actual_duration_minutes?: number | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          estimated_duration_minutes?: number | null
          actual_duration_minutes?: number | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood: string
          mood_value: number
          tags: string[] | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          mood?: string
          mood_value?: number
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          mood?: string
          mood_value?: number
          tags?: string[] | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string | null
          location: string | null
          event_type: string
          is_all_day: boolean
          reminder_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time?: string | null
          location?: string | null
          event_type?: string
          is_all_day?: boolean
          reminder_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          location?: string | null
          event_type?: string
          is_all_day?: boolean
          reminder_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      llm_context: {
        Row: {
          id: string
          user_id: string
          context_type: string
          content: Json
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          context_type: string
          content: Json
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          context_type?: string
          content?: Json
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quick_notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          tags: string[]
          goal_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          tags?: string[]
          goal_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          tags?: string[]
          goal_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_habit_streak: {
        Args: {
          habit_uuid: string
        }
        Returns: number
      }
      get_goal_progress: {
        Args: {
          goal_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
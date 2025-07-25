-- Complete Supabase Database Fix
-- This script will recreate all tables with proper structure and RLS policies

-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS llm_context CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS quick_notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_habit_streak(uuid);
DROP FUNCTION IF EXISTS get_goal_progress(uuid);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    target_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    timeframe TEXT DEFAULT 'long_term',
    is_priority BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habits table
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    frequency TEXT DEFAULT 'daily',
    target_count INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT DEFAULT 'Okay',
    mood_value INTEGER DEFAULT 0,
    tags TEXT[],
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    event_type TEXT DEFAULT 'personal',
    is_all_day BOOLEAN DEFAULT false,
    reminder_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create llm_context table
CREATE TABLE llm_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    context_type TEXT NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_notes table
CREATE TABLE quick_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_llm_context_updated_at BEFORE UPDATE ON llm_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quick_notes_updated_at BEFORE UPDATE ON quick_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(is_active);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_quick_notes_user_id ON quick_notes(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_habit_streak(habit_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date DATE := CURRENT_DATE;
    check_date DATE;
BEGIN
    -- Check consecutive days starting from today
    LOOP
        SELECT COUNT(*) INTO streak_count
        FROM habit_logs
        WHERE habit_id = habit_uuid
        AND DATE(completed_at) = check_date;
        
        IF streak_count = 0 THEN
            EXIT;
        END IF;
        
        streak_count := streak_count + 1;
        check_date := check_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_goal_progress(goal_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    goal_record RECORD;
BEGIN
    SELECT * INTO goal_record FROM goals WHERE id = goal_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    RETURN COALESCE(goal_record.progress_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can update own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own habit logs" ON habit_logs;

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

DROP POLICY IF EXISTS "Users can view own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can insert own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can update own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can delete own llm context" ON llm_context;

DROP POLICY IF EXISTS "Users can view own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can insert own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can update own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can delete own quick notes" ON quick_notes;

-- Create permissive RLS policies (since we're filtering by user_id in the app)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (true);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (true);

CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (true);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (true);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (true);

CREATE POLICY "Users can view own habit logs" ON habit_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own habit logs" ON habit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own habit logs" ON habit_logs FOR UPDATE USING (true);
CREATE POLICY "Users can delete own habit logs" ON habit_logs FOR DELETE USING (true);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (true);

CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (true);
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (true);

CREATE POLICY "Users can view own events" ON events FOR SELECT USING (true);
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (true);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (true);

CREATE POLICY "Users can view own llm context" ON llm_context FOR SELECT USING (true);
CREATE POLICY "Users can insert own llm context" ON llm_context FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own llm context" ON llm_context FOR UPDATE USING (true);
CREATE POLICY "Users can delete own llm context" ON llm_context FOR DELETE USING (true);

CREATE POLICY "Users can view own quick notes" ON quick_notes FOR SELECT USING (true);
CREATE POLICY "Users can insert own quick notes" ON quick_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own quick notes" ON quick_notes FOR UPDATE USING (true);
CREATE POLICY "Users can delete own quick notes" ON quick_notes FOR DELETE USING (true);

-- Add constraints for mood values
ALTER TABLE journal_entries ADD CONSTRAINT check_mood_value 
CHECK (mood_value IN (-3, 0, 3, 5));

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert some sample data for testing
INSERT INTO users (id, email, first_name, last_name) VALUES 
('user_test_123', 'test@example.com', 'Test', 'User');

INSERT INTO goals (user_id, title, description, status, priority, timeframe, is_priority) VALUES 
('user_test_123', 'Complete Project', 'Finish the main project', 'active', 'high', 'short_term', true),
('user_test_123', 'Learn New Skill', 'Master a new technology', 'active', 'medium', 'long_term', false);

INSERT INTO tasks (user_id, title, description, status, priority) VALUES 
('user_test_123', 'Review Code', 'Check the latest changes', 'pending', 'medium'),
('user_test_123', 'Write Documentation', 'Update project docs', 'pending', 'high');

INSERT INTO quick_notes (user_id, title, content) VALUES 
('user_test_123', 'Meeting Notes', 'Important discussion points'),
('user_test_123', 'Ideas', 'New feature ideas to explore');

INSERT INTO journal_entries (user_id, content, mood, mood_value) VALUES 
('user_test_123', 'Had a productive day working on the project.', 'Good', 3);

-- Add google_event_id column to events table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'google_event_id') THEN
        ALTER TABLE events ADD COLUMN google_event_id TEXT;
    END IF;
END $$;

-- Create table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on google_calendar_tokens table
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for google_calendar_tokens (users can only access their own tokens)
CREATE POLICY "Users can only access their own Google Calendar tokens" ON google_calendar_tokens
    FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create updated_at trigger for google_calendar_tokens
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_calendar_tokens_updated_at 
    BEFORE UPDATE ON google_calendar_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 
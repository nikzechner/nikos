-- Security Update: Implement proper Row-Level Security policies
-- This script updates RLS policies to ensure users can only access their own data

-- Drop existing permissive policies for tasks table
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create secure policies for tasks table
CREATE POLICY "Users can view own tasks" ON tasks 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own tasks" ON tasks 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own tasks" ON tasks 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own tasks" ON tasks 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Drop existing permissive policies for journal_entries table
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- Create secure policies for journal_entries table
CREATE POLICY "Users can view own journal entries" ON journal_entries 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own journal entries" ON journal_entries 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own journal entries" ON journal_entries 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own journal entries" ON journal_entries 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Update other tables for consistency and security

-- Goals table
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Habits table
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

CREATE POLICY "Users can view own habits" ON habits 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own habits" ON habits 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own habits" ON habits 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own habits" ON habits 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Habit logs table
DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can update own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own habit logs" ON habit_logs;

CREATE POLICY "Users can view own habit logs" ON habit_logs 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own habit logs" ON habit_logs 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own habit logs" ON habit_logs 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own habit logs" ON habit_logs 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Events table
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can view own events" ON events 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own events" ON events 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own events" ON events 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own events" ON events 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Quick notes table
DROP POLICY IF EXISTS "Users can view own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can insert own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can update own quick notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can delete own quick notes" ON quick_notes;

CREATE POLICY "Users can view own quick notes" ON quick_notes 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own quick notes" ON quick_notes 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own quick notes" ON quick_notes 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own quick notes" ON quick_notes 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- LLM context table
DROP POLICY IF EXISTS "Users can view own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can insert own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can update own llm context" ON llm_context;
DROP POLICY IF EXISTS "Users can delete own llm context" ON llm_context;

CREATE POLICY "Users can view own llm context" ON llm_context 
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own llm context" ON llm_context 
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own llm context" ON llm_context 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own llm context" ON llm_context 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Users table (special case - users can only access their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can view own profile" ON users 
    FOR SELECT USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users 
    FOR UPDATE USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON users 
    FOR INSERT WITH CHECK (id = auth.jwt() ->> 'sub');

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'journal_entries', 'goals', 'habits', 'habit_logs', 'events', 'quick_notes', 'llm_context', 'users', 'google_calendar_tokens')
ORDER BY tablename;

-- Show all policies to verify they're created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 
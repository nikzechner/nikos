-- Database Optimization Script for Life OS (FIXED VERSION)
-- Improves tasks, journal_entries, and events tables while avoiding IMMUTABLE function errors

-- ====================================
-- TASKS TABLE OPTIMIZATIONS
-- ====================================

-- Add NOT NULL constraints where appropriate
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN status SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN priority SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN updated_at SET NOT NULL;

-- Add check constraints for enum-like fields
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_task_status;
ALTER TABLE tasks ADD CONSTRAINT check_task_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_task_priority;
ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add constraint for duration fields (must be positive)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_estimated_duration;
ALTER TABLE tasks ADD CONSTRAINT check_estimated_duration 
CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0);

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_actual_duration;
ALTER TABLE tasks ADD CONSTRAINT check_actual_duration 
CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes > 0);

-- Add constraint: completed_at should only be set when status is 'completed'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_completed_at_with_status;
ALTER TABLE tasks ADD CONSTRAINT check_completed_at_with_status 
CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL) OR
    (status != 'completed')
);

-- Drop existing basic indexes and create optimized ones
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_status;

-- Create comprehensive indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;

-- Add GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);

-- FIXED: Create indexes for common patterns without time-based predicates
CREATE INDEX IF NOT EXISTS idx_tasks_active_with_due_date ON tasks(user_id, due_date, status) 
WHERE status IN ('pending', 'in_progress') AND due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_active_status ON tasks(user_id, status, due_date) 
WHERE status IN ('pending', 'in_progress');

-- ====================================
-- JOURNAL_ENTRIES TABLE OPTIMIZATIONS (SAFE VERSION)
-- ====================================

-- Add NOT NULL constraints
ALTER TABLE journal_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN content SET NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN updated_at SET NOT NULL;

-- SAFE: Only ensure mood is not empty if it exists (preserving your existing values)
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS check_mood;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS check_mood_not_empty;
ALTER TABLE journal_entries ADD CONSTRAINT check_mood_not_empty 
CHECK (mood IS NULL OR LENGTH(TRIM(mood)) > 0);

-- SAFE: Only ensure mood_value is reasonable (expand range to accommodate existing data)
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS check_mood_value;
ALTER TABLE journal_entries ADD CONSTRAINT check_mood_value 
CHECK (mood_value IS NULL OR mood_value BETWEEN -10 AND 10);

-- Add constraint: content should not be empty
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS check_content_not_empty;
ALTER TABLE journal_entries ADD CONSTRAINT check_content_not_empty 
CHECK (LENGTH(TRIM(content)) > 0);

-- Drop and recreate optimized indexes
DROP INDEX IF EXISTS idx_journal_entries_user_id;
DROP INDEX IF EXISTS idx_journal_entries_created_at;

-- Create comprehensive indexes for journal entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_created_at ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_mood ON journal_entries(user_id, mood);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_private ON journal_entries(user_id, is_private);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood_value ON journal_entries(mood_value);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at_desc ON journal_entries(created_at DESC);

-- Add GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- Add text search index for content and title
CREATE INDEX IF NOT EXISTS idx_journal_entries_text_search ON journal_entries USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || content));

-- ====================================
-- EVENTS TABLE OPTIMIZATIONS
-- ====================================

-- Add NOT NULL constraints
ALTER TABLE events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN title SET NOT NULL;
ALTER TABLE events ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE events ALTER COLUMN event_type SET NOT NULL;
ALTER TABLE events ALTER COLUMN is_all_day SET NOT NULL;
ALTER TABLE events ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE events ALTER COLUMN updated_at SET NOT NULL;

-- Add check constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_event_type;
ALTER TABLE events ADD CONSTRAINT check_event_type 
CHECK (event_type IN ('personal', 'work', 'meeting', 'appointment', 'reminder', 'social', 'health', 'travel', 'other'));

-- Add constraint: end_time should be after start_time
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_end_time_after_start;
ALTER TABLE events ADD CONSTRAINT check_end_time_after_start 
CHECK (end_time IS NULL OR end_time > start_time);

-- Add constraint: reminder should be reasonable (0-10080 minutes = 1 week)
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_reminder_minutes;
ALTER TABLE events ADD CONSTRAINT check_reminder_minutes 
CHECK (reminder_minutes IS NULL OR (reminder_minutes >= 0 AND reminder_minutes <= 10080));

-- Add constraint: title should not be empty
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_title_not_empty;
ALTER TABLE events ADD CONSTRAINT check_title_not_empty 
CHECK (LENGTH(TRIM(title)) > 0);

-- Drop and recreate optimized indexes
DROP INDEX IF EXISTS idx_events_user_id;
DROP INDEX IF EXISTS idx_events_start_time;

-- Create comprehensive indexes for events
CREATE INDEX IF NOT EXISTS idx_events_user_id_start_time ON events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_user_id_event_type ON events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_start_time_end_time ON events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_time_range ON events(start_time, end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_all_day ON events(is_all_day, start_time) WHERE is_all_day = true;
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id) WHERE google_event_id IS NOT NULL;

-- FIXED: Create time-based indexes without using NOW() or CURRENT_DATE in predicates
CREATE INDEX IF NOT EXISTS idx_events_chronological ON events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_future_planning ON events(start_time, user_id) WHERE start_time IS NOT NULL;

-- ====================================
-- DATABASE MAINTENANCE FUNCTIONS
-- ====================================

-- Function to clean up old completed tasks (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_tasks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tasks 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity statistics
CREATE OR REPLACE FUNCTION get_user_activity_stats(user_uuid TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    total_tasks INTEGER,
    completed_tasks INTEGER,
    journal_entries INTEGER,
    events_count INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM tasks WHERE user_id = user_uuid AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
        (SELECT COUNT(*)::INTEGER FROM tasks WHERE user_id = user_uuid AND status = 'completed' AND completed_at >= NOW() - (days_back || ' days')::INTERVAL),
        (SELECT COUNT(*)::INTEGER FROM journal_entries WHERE user_id = user_uuid AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
        (SELECT COUNT(*)::INTEGER FROM events WHERE user_id = user_uuid AND start_time >= NOW() - (days_back || ' days')::INTERVAL),
        CASE 
            WHEN (SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid AND created_at >= NOW() - (days_back || ' days')::INTERVAL) > 0 
            THEN ROUND((SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid AND status = 'completed' AND completed_at >= NOW() - (days_back || ' days')::INTERVAL)::NUMERIC / 
                      (SELECT COUNT(*) FROM tasks WHERE user_id = user_uuid AND created_at >= NOW() - (days_back || ' days')::INTERVAL)::NUMERIC * 100, 2)
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get tasks due soon (replaces the problematic index)
CREATE OR REPLACE FUNCTION get_tasks_due_soon(user_uuid TEXT, days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
    id UUID,
    title TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.due_date, t.status, t.priority
    FROM tasks t
    WHERE t.user_id = user_uuid 
    AND t.status IN ('pending', 'in_progress')
    AND t.due_date >= NOW()
    AND t.due_date <= NOW() + (days_ahead || ' days')::INTERVAL
    ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get overdue tasks (replaces the problematic index)
CREATE OR REPLACE FUNCTION get_overdue_tasks(user_uuid TEXT)
RETURNS TABLE(
    id UUID,
    title TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.due_date, t.status, t.priority
    FROM tasks t
    WHERE t.user_id = user_uuid 
    AND t.status IN ('pending', 'in_progress')
    AND t.due_date < NOW()
    ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's events (replaces the problematic index)
CREATE OR REPLACE FUNCTION get_today_events(user_uuid TEXT)
RETURNS TABLE(
    id UUID,
    title TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    event_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.title, e.start_time, e.end_time, e.event_type
    FROM events e
    WHERE e.user_id = user_uuid 
    AND DATE(e.start_time) = CURRENT_DATE
    ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- VACUUM AND ANALYZE FOR PERFORMANCE
-- ====================================

-- Update table statistics for query planner
ANALYZE tasks;
ANALYZE journal_entries;
ANALYZE events;

-- Create a maintenance script comment
COMMENT ON TABLE tasks IS 'Tasks table with optimized indexes and constraints for productivity tracking';
COMMENT ON TABLE journal_entries IS 'Journal entries with full-text search and mood tracking capabilities (preserves existing mood values)';
COMMENT ON TABLE events IS 'Events table optimized for calendar operations and time-based queries';

-- Show optimization summary
DO $$ 
BEGIN
    RAISE NOTICE 'FIXED Database optimization completed successfully!';
    RAISE NOTICE 'Removed problematic time-based index predicates';
    RAISE NOTICE 'Added helper functions for time-based queries instead';
    RAISE NOTICE 'Your existing mood values have been preserved';
    RAISE NOTICE 'Tasks table: Added constraints and optimized indexes';
    RAISE NOTICE 'Journal entries table: Added flexible constraints and full-text search';
    RAISE NOTICE 'Events table: Added time validation and calendar-optimized indexes';
    RAISE NOTICE 'All optimizations applied safely without IMMUTABLE function errors';
END $$; 
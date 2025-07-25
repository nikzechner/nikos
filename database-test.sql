-- Simple Database Test Script
-- Run this after the main fix to verify everything is working

-- Test 1: Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'goals', 'habits', 'tasks', 'journal_entries', 'quick_notes', 'events', 'llm_context', 'habit_logs')
ORDER BY table_name;

-- Test 2: Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'goals', 'habits', 'tasks', 'journal_entries', 'quick_notes', 'events', 'llm_context', 'habit_logs');

-- Test 3: Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'goals', 'habits', 'tasks', 'journal_entries', 'quick_notes', 'events', 'llm_context', 'habit_logs');

-- Test 4: Check sample data
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'goals' as table_name, COUNT(*) as count FROM goals
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'quick_notes' as table_name, COUNT(*) as count FROM quick_notes
UNION ALL
SELECT 'journal_entries' as table_name, COUNT(*) as count FROM journal_entries;

-- Test 5: Test basic insert (should work with permissive policies)
INSERT INTO tasks (user_id, title, description, status, priority) 
VALUES ('test_user_456', 'Test Task', 'This is a test task', 'pending', 'medium')
RETURNING id, title, status;

-- Test 6: Test basic select (should work with permissive policies)
SELECT id, title, status FROM tasks WHERE user_id = 'test_user_456';

-- Test 7: Test basic update (should work with permissive policies)
UPDATE tasks 
SET status = 'completed' 
WHERE user_id = 'test_user_456' AND title = 'Test Task'
RETURNING id, title, status;

-- Test 8: Test basic delete (should work with permissive policies)
DELETE FROM tasks 
WHERE user_id = 'test_user_456' AND title = 'Test Task'
RETURNING id, title;

-- Test 9: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_habit_streak', 'get_goal_progress', 'update_updated_at_column');

-- Test 10: Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'goals', 'habits', 'tasks', 'journal_entries', 'quick_notes', 'events', 'llm_context', 'habit_logs');

-- Test 11: Check constraints
SELECT conname, conrelid::regclass as table_name, contype 
FROM pg_constraint 
WHERE conrelid::regclass::text IN ('users', 'goals', 'habits', 'tasks', 'journal_entries', 'quick_notes', 'events', 'llm_context', 'habit_logs')
AND contype IN ('p', 'f', 'c'); -- p=primary key, f=foreign key, c=check

-- Test 12: Verify mood constraint works
INSERT INTO journal_entries (user_id, content, mood, mood_value) 
VALUES ('test_user_456', 'Testing mood constraint', 'Good', 3)
RETURNING id, mood, mood_value;

-- This should fail (invalid mood_value):
-- INSERT INTO journal_entries (user_id, content, mood, mood_value) 
-- VALUES ('test_user_456', 'Testing invalid mood', 'Invalid', 10);

-- Clean up test data
DELETE FROM journal_entries WHERE user_id = 'test_user_456';

SELECT 'Database test completed successfully!' as result; 
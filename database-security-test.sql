-- Security Test Script
-- This script tests that RLS policies are working correctly

-- First, let's verify that RLS is enabled on all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'journal_entries', 'goals', 'habits', 'habit_logs', 'events', 'quick_notes', 'llm_context', 'users', 'google_calendar_tokens')
ORDER BY tablename;

-- Check that all policies exist and are properly configured
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as "Operation",
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause' 
        ELSE 'No USING clause' 
    END as "USING_Status",
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause' 
        ELSE 'No WITH CHECK clause' 
    END as "WITH_CHECK_Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'journal_entries', 'goals', 'habits', 'habit_logs', 'events', 'quick_notes', 'llm_context', 'users', 'google_calendar_tokens')
ORDER BY tablename, policyname;

-- Test data insertion and access patterns
-- Note: These tests should be run with actual authenticated users to fully verify security

-- Check if there are any existing tasks (should be empty if RLS is working and no authenticated user)
SELECT COUNT(*) as "Task Count (should reflect current user's data only)" FROM tasks;

-- Check if there are any existing journal entries
SELECT COUNT(*) as "Journal Entry Count (should reflect current user's data only)" FROM journal_entries;

-- Verify that the auth.jwt() function works (this will show the current JWT claims if authenticated)
SELECT 
    CASE 
        WHEN auth.jwt() IS NOT NULL THEN 'JWT token available'
        ELSE 'No JWT token (not authenticated)'
    END as "Auth Status",
    CASE 
        WHEN auth.jwt() ->> 'sub' IS NOT NULL THEN auth.jwt() ->> 'sub'
        ELSE 'No user ID available'
    END as "Current User ID";

-- Show sample of how the policies work
-- This will show the actual SQL conditions being applied
SELECT 
    t.tablename,
    p.policyname,
    p.qual as "USING condition",
    p.with_check as "WITH CHECK condition"
FROM pg_policies p
JOIN pg_tables t ON p.tablename = t.tablename
WHERE p.schemaname = 'public'
AND p.tablename IN ('tasks', 'journal_entries')
ORDER BY t.tablename, p.policyname;

-- Security verification checklist
SELECT 
    'Security Verification Results' as "Status",
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND qual LIKE '%auth.jwt()%') >= 4 
        THEN '✅ Tasks table has secure policies'
        ELSE '❌ Tasks table policies need review'
    END as "Tasks Security",
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'journal_entries' AND qual LIKE '%auth.jwt()%') >= 4 
        THEN '✅ Journal entries table has secure policies'
        ELSE '❌ Journal entries table policies need review'
    END as "Journal Security",
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('tasks', 'journal_entries')) = 2
        THEN '✅ RLS is enabled on target tables'
        ELSE '❌ RLS needs to be enabled'
    END as "RLS Status";

-- Instructions for manual testing
SELECT 
    'Manual Testing Instructions' as "Instructions",
    '1. Sign in as User A and create some tasks/journal entries' as "Step 1",
    '2. Sign in as User B and verify you cannot see User A data' as "Step 2",
    '3. Try to create/update/delete data and verify it only affects your own records' as "Step 3",
    '4. Check that API calls properly pass user authentication' as "Step 4"; 
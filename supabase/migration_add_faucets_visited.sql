-- ============================================================================
-- Migration: Add faucets_visited to users table
-- ============================================================================
-- This migration adds tracking for unique faucets visited per user
-- ============================================================================

-- Add faucets_visited column to users table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'faucets_visited'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN faucets_visited INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add constraint to ensure non-negative (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE c.conname = 'users_faucets_visited_check'
        AND t.relname = 'users'
        AND n.nspname = 'public'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_faucets_visited_check 
        CHECK (faucets_visited >= 0);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Update existing users with their unique faucet count
UPDATE public.users u
SET faucets_visited = COALESCE(
    (SELECT COUNT(DISTINCT faucet_id) 
     FROM public.user_claims 
     WHERE user_address = u.address),
    0
)
WHERE faucets_visited = 0 OR faucets_visited IS NULL;

COMMENT ON COLUMN public.users.faucets_visited IS 'Number of unique faucets this user has visited (claimed coins from)';


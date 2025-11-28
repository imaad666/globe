-- ============================================================================
-- Migration: Add users table
-- ============================================================================
-- This migration adds a users table to track all wallet connections
-- Run this AFTER schema.sql if you already have data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
-- Stores user accounts (wallet addresses) - created when wallet connects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    address TEXT PRIMARY KEY,
    first_connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for sorting by first connection
CREATE INDEX IF NOT EXISTS idx_users_first_connected 
    ON public.users(first_connected_at DESC);

-- ----------------------------------------------------------------------------
-- Migrate existing user addresses from user_claims to users table
-- ----------------------------------------------------------------------------
INSERT INTO public.users (address, first_connected_at, last_seen_at, created_at)
SELECT DISTINCT
    user_address as address,
    MIN(created_at) as first_connected_at,
    MAX(created_at) as last_seen_at,
    MIN(created_at) as created_at
FROM public.user_claims
WHERE user_address NOT IN (SELECT address FROM public.users)
GROUP BY user_address
ON CONFLICT (address) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Update user_claims to reference users table (add foreign key)
-- ----------------------------------------------------------------------------
-- First, we need to add the foreign key constraint
-- Note: This will fail if there are user_addresses in user_claims that don't exist in users
ALTER TABLE public.user_claims
ADD CONSTRAINT user_claims_user_address_fkey 
FOREIGN KEY (user_address) 
REFERENCES public.users(address) 
ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- Function: ensure_user_exists
-- ----------------------------------------------------------------------------
-- Creates a user record if they don't exist (called when wallet connects)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_user_exists(p_user_address TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE address = p_user_address) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        -- Create new user
        INSERT INTO public.users (address, first_connected_at, last_seen_at)
        VALUES (p_user_address, NOW(), NOW())
        ON CONFLICT (address) DO UPDATE
        SET last_seen_at = NOW();
    ELSE
        -- Update last_seen_at
        UPDATE public.users
        SET last_seen_at = NOW()
        WHERE address = p_user_address;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'address', p_user_address
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ----------------------------------------------------------------------------
-- Update claim_coins function to ensure user exists
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_coins(
    p_faucet_id UUID,
    p_user_wallet TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_remaining_coins INTEGER;
    v_result JSONB;
BEGIN
    -- Ensure user exists (create if they don't)
    PERFORM public.ensure_user_exists(p_user_wallet);
    
    -- Lock the faucet row for update to prevent race conditions
    SELECT remaining_coins INTO v_remaining_coins
    FROM public.faucets
    WHERE id = p_faucet_id
      AND is_active = true
    FOR UPDATE;
    
    -- Check if faucet exists and has coins
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Faucet not found or inactive'
        );
    END IF;
    
    IF v_remaining_coins <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Faucet is empty',
            'remaining_coins', v_remaining_coins
        );
    END IF;
    
    -- Atomically decrement remaining coins and create claim record
    UPDATE public.faucets
    SET remaining_coins = remaining_coins - 1
    WHERE id = p_faucet_id
    RETURNING remaining_coins INTO v_remaining_coins;
    
    -- Insert the claim record
    INSERT INTO public.user_claims (user_address, faucet_id, amount)
    VALUES (p_user_wallet, p_faucet_id, 1);
    
    -- Return success with updated remaining coins
    RETURN jsonb_build_object(
        'success', true,
        'remaining_coins', v_remaining_coins,
        'amount_claimed', 1
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error if something goes wrong
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security for users table
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user info
CREATE POLICY "Allow public read access to users"
    ON public.users
    FOR SELECT
    USING (true);

-- Allow inserting new users (when wallet connects)
CREATE POLICY "Allow insert for new users"
    ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Allow updating last_seen_at
CREATE POLICY "Allow update last_seen_at"
    ON public.users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.users IS 'Stores all users who connect their wallet (wallet address is primary key)';
COMMENT ON FUNCTION public.ensure_user_exists(TEXT) IS 'Creates or updates a user record when wallet connects';


-- ============================================================================
-- Monad Go Database Schema
-- ============================================================================
-- This schema sets up tables, views, functions, and realtime subscriptions
-- for a geo-location game where users collect coins from faucets on a map.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: faucets
-- ----------------------------------------------------------------------------
-- Represents loot/coin locations on the map that players can collect from
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faucets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    total_coins INTEGER NOT NULL DEFAULT 100,
    remaining_coins INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    contract_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure remaining_coins doesn't exceed total_coins and is non-negative
    CONSTRAINT faucets_remaining_coins_check 
        CHECK (remaining_coins >= 0 AND remaining_coins <= total_coins),
    
    -- Ensure valid coordinates
    CONSTRAINT faucets_coordinates_check
        CHECK (lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180)
);

-- Index for contract address lookups
CREATE INDEX IF NOT EXISTS idx_faucets_contract_address 
    ON public.faucets(contract_address) 
    WHERE contract_address IS NOT NULL;

-- Index for fast spatial queries (finding faucets near a location)
-- Using separate indexes on lat/lng for bounding box queries
-- For more advanced spatial queries, consider using PostGIS extension
CREATE INDEX IF NOT EXISTS idx_faucets_lat 
    ON public.faucets(lat);
CREATE INDEX IF NOT EXISTS idx_faucets_lng 
    ON public.faucets(lng);
CREATE INDEX IF NOT EXISTS idx_faucets_lat_lng 
    ON public.faucets(lat, lng);

-- Index for filtering active faucets
CREATE INDEX IF NOT EXISTS idx_faucets_is_active 
    ON public.faucets(is_active) WHERE is_active = true;

-- Index for finding faucets with remaining coins
CREATE INDEX IF NOT EXISTS idx_faucets_remaining_coins 
    ON public.faucets(remaining_coins) WHERE remaining_coins > 0 AND is_active = true;

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
-- Stores all users who connect their wallet (login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    address TEXT PRIMARY KEY,
    first_connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_coins_collected INTEGER NOT NULL DEFAULT 0,
    total_claims INTEGER NOT NULL DEFAULT 0,
    
    -- Ensure non-negative values
    CONSTRAINT users_total_coins_check CHECK (total_coins_collected >= 0),
    CONSTRAINT users_total_claims_check CHECK (total_claims >= 0)
);

-- Index for sorting by coins collected
CREATE INDEX IF NOT EXISTS idx_users_total_coins 
    ON public.users(total_coins_collected DESC);

-- Index for sorting by first connected
CREATE INDEX IF NOT EXISTS idx_users_first_connected 
    ON public.users(first_connected_at DESC);

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
-- Stores user accounts (wallet addresses) - created when wallet connects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    address TEXT PRIMARY KEY,
    first_connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    faucets_visited INTEGER NOT NULL DEFAULT 0,
    
    -- Ensure non-negative values
    CONSTRAINT users_faucets_visited_check CHECK (faucets_visited >= 0)
);

-- Index for sorting by first connection
CREATE INDEX IF NOT EXISTS idx_users_first_connected 
    ON public.users(first_connected_at DESC);

-- ----------------------------------------------------------------------------
-- Table: user_claims
-- ----------------------------------------------------------------------------
-- Ledger of all coin collections made by users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL REFERENCES public.users(address) ON DELETE CASCADE,
    faucet_id UUID NOT NULL REFERENCES public.faucets(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure amount is positive
    CONSTRAINT user_claims_amount_check CHECK (amount > 0)
);

-- Index for fast user lookups (for leaderboard and user stats)
CREATE INDEX IF NOT EXISTS idx_user_claims_user_address 
    ON public.user_claims(user_address);

-- Index for time-based queries (recent activity, daily stats)
CREATE INDEX IF NOT EXISTS idx_user_claims_created_at 
    ON public.user_claims(created_at DESC);

-- Index for faucet lookups (showing who claimed from a faucet)
CREATE INDEX IF NOT EXISTS idx_user_claims_faucet_id 
    ON public.user_claims(faucet_id);

-- Composite index for user + time queries
CREATE INDEX IF NOT EXISTS idx_user_claims_user_created 
    ON public.user_claims(user_address, created_at DESC);

-- ----------------------------------------------------------------------------
-- View: view_leaderboard
-- ----------------------------------------------------------------------------
-- Aggregated leaderboard showing total coins collected per user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_leaderboard AS
SELECT 
    user_address,
    SUM(amount) AS total_score,
    COUNT(*) AS total_claims,
    MAX(created_at) AS last_claim_at
FROM public.user_claims
GROUP BY user_address
ORDER BY total_score DESC;

-- ----------------------------------------------------------------------------
-- View: view_recent_activity
-- ----------------------------------------------------------------------------
-- Recent claims joined with faucet names for activity feeds
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_recent_activity AS
SELECT 
    uc.id,
    uc.user_address,
    uc.faucet_id,
    f.name AS faucet_name,
    f.lat AS faucet_lat,
    f.lng AS faucet_lng,
    uc.amount,
    uc.created_at
FROM public.user_claims uc
INNER JOIN public.faucets f ON uc.faucet_id = f.id
ORDER BY uc.created_at DESC;

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
-- Function: claim_coins
-- ----------------------------------------------------------------------------
-- Atomic function to claim coins from a faucet
-- Ensures thread-safe coin deduction even with concurrent requests
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
    v_is_new_faucet BOOLEAN;
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
    
    -- Check if this is a new faucet for this user (before inserting)
    SELECT NOT EXISTS(
        SELECT 1 FROM public.user_claims 
        WHERE user_address = p_user_wallet 
        AND faucet_id = p_faucet_id
    ) INTO v_is_new_faucet;
    
    -- Atomically decrement remaining coins
    UPDATE public.faucets
    SET remaining_coins = remaining_coins - 1
    WHERE id = p_faucet_id
    RETURNING remaining_coins INTO v_remaining_coins;
    
    -- Insert the claim record
    INSERT INTO public.user_claims (user_address, faucet_id, amount)
    VALUES (p_user_wallet, p_faucet_id, 1);
    
    -- If this is a new faucet, increment faucets_visited
    IF v_is_new_faucet THEN
        UPDATE public.users
        SET faucets_visited = COALESCE(faucets_visited, 0) + 1
        WHERE address = p_user_wallet;
    END IF;
    
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.claim_coins(UUID, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Realtime Configuration
-- ----------------------------------------------------------------------------
-- Enable Realtime (replication) for live updates on the map and activity feed
-- Note: If these commands fail because tables are already in the publication,
-- you can safely ignore the error or remove these lines after first run.
-- ----------------------------------------------------------------------------

-- Enable Realtime for faucets table (map updates live)
-- This allows clients to subscribe to faucet changes in real-time
-- Note: If this fails, enable Realtime via Supabase Dashboard > Database > Replication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faucets;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add faucets to realtime publication (may already be added): %', SQLERRM;
END $$;

-- Enable Realtime for user_claims table (activity feed updates live)
-- This allows clients to subscribe to new claims in real-time
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_claims;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add user_claims to realtime publication (may already be added): %', SQLERRM;
END $$;

-- Alternative: If the above doesn't work, you can also enable Realtime via:
-- 1. Supabase Dashboard: Database > Replication > Enable for each table
-- 2. Or ensure REPLICA IDENTITY is set correctly:
ALTER TABLE public.faucets REPLICA IDENTITY FULL;
ALTER TABLE public.user_claims REPLICA IDENTITY FULL;

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
-- Enable RLS for both tables
-- ----------------------------------------------------------------------------

-- Enable RLS on faucets
ALTER TABLE public.faucets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active faucets
CREATE POLICY "Allow public read access to active faucets"
    ON public.faucets
    FOR SELECT
    USING (is_active = true);

-- Note: Server-side API routes use supabaseServer with service role,
-- which bypasses RLS by default, so admin operations will work.
-- If you need client-side inserts, add policies here.

-- Enable RLS on user_claims
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all claims (for leaderboard and activity feed)
CREATE POLICY "Allow public read access to user_claims"
    ON public.user_claims
    FOR SELECT
    USING (true);

-- Allow inserting claims through the claim_coins function
-- The function handles validation, so we allow inserts
CREATE POLICY "Allow insert through claim_coins function"
    ON public.user_claims
    FOR INSERT
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Helper Functions (Optional but useful)
-- ----------------------------------------------------------------------------

-- Function to get nearby faucets (requires earthdistance extension)
-- CREATE EXTENSION IF NOT EXISTS cube;
-- CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Helper function to get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_address TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_score', COALESCE(SUM(amount), 0),
        'total_claims', COUNT(*),
        'last_claim_at', MAX(created_at)
    ) INTO v_stats
    FROM public.user_claims
    WHERE user_address = p_user_address;
    
    RETURN COALESCE(v_stats, jsonb_build_object(
        'total_score', 0,
        'total_claims', 0,
        'last_claim_at', NULL
    ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Comments for Documentation
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.faucets IS 'Coin locations on the map that players can collect from';
COMMENT ON TABLE public.user_claims IS 'Ledger of all coin collections made by users';
COMMENT ON VIEW public.view_leaderboard IS 'Aggregated leaderboard showing total coins per user';
COMMENT ON VIEW public.view_recent_activity IS 'Recent claims with faucet information for activity feeds';
COMMENT ON FUNCTION public.claim_coins(UUID, TEXT) IS 'Atomically claims coins from a faucet, preventing race conditions';
COMMENT ON FUNCTION public.get_user_stats(TEXT) IS 'Returns statistics for a specific user address';


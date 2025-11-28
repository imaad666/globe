-- ============================================================================
-- Monad Go - Seed Data
-- ============================================================================
-- This file populates the database with initial faucet locations
-- Run this after running schema.sql
-- ============================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.user_claims CASCADE;
-- TRUNCATE TABLE public.faucets CASCADE;

-- ----------------------------------------------------------------------------
-- Seed Faucets (Coin Locations)
-- ----------------------------------------------------------------------------
-- Add initial faucet locations around Bangalore, India (default map center)
-- You can customize these coordinates to match your target area
-- ----------------------------------------------------------------------------

-- Central Bangalore area - spread faucets around
INSERT INTO public.faucets (name, lat, lng, total_coins, remaining_coins, is_active) VALUES
-- City center locations
('Bangalore Palace', 12.9977, 77.5925, 100, 100, true),
('Cubbon Park', 12.9716, 77.5946, 100, 100, true),
('Vidhana Soudha', 12.9784, 77.5908, 100, 100, true),
('Lalbagh Botanical Garden', 12.9507, 77.5848, 100, 100, true),
('UB City Mall', 12.9708, 77.6095, 100, 100, true),

-- Commercial Street area
('Commercial Street', 12.9733, 77.6083, 100, 100, true),
('MG Road', 12.9750, 77.6092, 100, 100, true),
('Brigade Road', 12.9742, 77.6097, 100, 100, true),

-- Tech parks (Silicon Valley of India!)
('Manyata Tech Park', 13.0457, 77.6200, 100, 100, true),
('Electronic City', 12.8456, 77.6633, 100, 100, true),
('Whitefield', 12.9698, 77.7499, 100, 100, true),
('ITPL', 12.9698, 77.7499, 100, 100, true),

-- Educational institutions
('IISC Bangalore', 12.9904, 77.5668, 100, 100, true),
('IIT Bangalore', 13.0150, 77.5675, 100, 100, true),

-- Parks and landmarks
('Bannerghatta National Park', 12.8000, 77.5783, 100, 100, true),
('Wonderla Amusement Park', 13.0694, 77.4031, 100, 100, true),
('Nandi Hills', 13.3903, 77.6869, 100, 100, true),

-- Shopping centers
('Phoenix Mall', 12.9344, 77.6994, 100, 100, true),
('Orion Mall', 12.9353, 77.7011, 100, 100, true),
('Forum Mall', 12.9338, 77.6911, 100, 100, true),

-- Transit hubs
('Kempegowda Bus Station', 12.9759, 77.5663, 100, 100, true),
('Bangalore City Railway Station', 12.9716, 77.5662, 100, 100, true),
('Kempegowda International Airport', 13.1986, 77.7066, 100, 100, true),

-- Residential areas
('Indiranagar', 12.9789, 77.6408, 100, 100, true),
('Koramangala', 12.9352, 77.6245, 100, 100, true),
('HSR Layout', 12.9124, 77.6441, 100, 100, true),
('BTM Layout', 12.9167, 77.6100, 100, 100, true);

-- ----------------------------------------------------------------------------
-- Verify the seed data
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) as total_faucets,
    SUM(remaining_coins) as total_coins_available,
    COUNT(*) FILTER (WHERE is_active = true) as active_faucets
FROM public.faucets;

-- Show all faucets
SELECT id, name, lat, lng, remaining_coins, is_active 
FROM public.faucets 
ORDER BY name;


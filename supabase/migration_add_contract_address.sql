-- ============================================================================
-- Migration: Add contract_address to faucets table
-- ============================================================================
-- Each faucet will have a Solidity contract address that holds MON tokens
-- ============================================================================

-- Add contract_address column to faucets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'faucets' 
        AND column_name = 'contract_address'
    ) THEN
        ALTER TABLE public.faucets 
        ADD COLUMN contract_address TEXT;
        
        -- Add index for contract lookups
        CREATE INDEX IF NOT EXISTS idx_faucets_contract_address 
        ON public.faucets(contract_address) 
        WHERE contract_address IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.faucets.contract_address IS 'Address of the Solidity contract that holds MON tokens for this faucet';


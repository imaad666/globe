-- Add test faucet at coordinates (12.961311, 77.710243)
-- With 0.1 MON (10 coins, each worth 0.01 MON)

INSERT INTO public.faucets (name, lat, lng, total_coins, remaining_coins, is_active)
VALUES (
    'Test Mining Faucet',
    12.961311,
    77.710243,
    10,
    10,
    true
)
ON CONFLICT DO NOTHING;

-- Note: contract_address will be added after deploying the contract


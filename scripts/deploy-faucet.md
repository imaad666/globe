# Deploy Faucet Contract

## Prerequisites
1. Install Hardhat or Foundry
2. Have MON token contract address
3. Have testnet MON tokens to fund the faucet

## Steps

1. **Update MON Token Address**
   - Update `NEXT_PUBLIC_MON_TOKEN_ADDRESS` in `.env.local` with your MON token contract address

2. **Deploy Faucet Contract**
   ```bash
   # Using Hardhat or Foundry
   # Deploy FaucetContract with:
   # - MON_TOKEN: Your MON token contract address
   # - owner: Your wallet address (to fund the faucet)
   ```

3. **Fund the Faucet**
   - Transfer MON tokens to the deployed faucet contract address
   - Example: Transfer 0.1 MON to faucet contract for 10 mines (0.01 each)

4. **Link Contract to Faucet**
   - Update the faucet in database with contract address:
   ```sql
   UPDATE faucets 
   SET contract_address = '0x...' 
   WHERE name = 'Test Mining Faucet';
   ```
   
   Or use the API:
   ```bash
   curl -X PUT http://localhost:3000/api/admin/faucets/contract \
     -H "Content-Type: application/json" \
     -d '{"faucet_id": "...", "contract_address": "0x..."}'
   ```

## Contract Details
- **Mine Amount**: 0.01 MON per transaction
- **Cooldown**: 60 seconds between mines
- **Mining Radius**: 50 meters from faucet location


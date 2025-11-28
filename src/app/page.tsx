'use client';

import Providers from '@/context/Providers';
import GameMap from '@/components/GameMap';
import LoginScreen from '@/components/LoginScreen';
import WalletButton from '@/components/WalletButton';
import { useAccount, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';

const MONAD_TESTNET_CHAIN_ID = 10143;

function GameContent() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isOnMonadTestnet = chainId === MONAD_TESTNET_CHAIN_ID;
  const showLogin = !isConnected || !isOnMonadTestnet;

  // Only render conditional content after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-screen h-screen">
      {/* Map always visible in background */}
      <GameMap />
      
      {/* Purple overlay when login is required */}
      {mounted && showLogin && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-gray-900/40 z-20 backdrop-blur-[2px] pointer-events-none">
          <div className="pointer-events-auto">
            <LoginScreen />
          </div>
        </div>
      )}

      {/* Wallet button only shown when connected */}
      {mounted && !showLogin && (
        <div className="absolute top-4 left-4 z-10">
          <WalletButton />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <GameContent />
    </Providers>
  );
}

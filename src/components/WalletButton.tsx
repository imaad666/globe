'use client';

import { ConnectWallet } from './ConnectWallet';
import { useAccount } from 'wagmi';
import { getUserData } from '@/actions/game';
import { useQuery } from '@tanstack/react-query';

export default function WalletButton() {
  const { address, isConnected } = useAccount();

  const { data: userData } = useQuery({
    queryKey: ['userData', address],
    queryFn: async () => {
      if (!address) return null;
      const result = await getUserData(address);
      return result.user;
    },
    enabled: !!address && isConnected,
  });

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
          <div className="text-xs text-gray-400">Collected MON</div>
          <div className="text-xl font-bold text-purple-400">
            {userData?.score || 0}
          </div>
        </div>
        <ConnectWallet />
      </div>
    );
  }

  return <ConnectWallet />;
}

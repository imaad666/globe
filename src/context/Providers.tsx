'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { config } from '@/config/web3';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  // If no Google Maps key, show error
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Missing Google Maps API Key</h1>
          <p className="text-gray-400">
            Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to your .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>{children}</APIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

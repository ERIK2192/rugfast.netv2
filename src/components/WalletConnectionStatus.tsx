
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader } from 'lucide-react';

export const WalletConnectionStatus: React.FC = () => {
  const { connecting, connected, wallet } = useWallet();

  if (connecting) {
    return (
      <div className="flex items-center space-x-2 text-cyan-400">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm">Connecting to {wallet?.adapter.name}...</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm">Connected to {wallet?.adapter.name}</span>
      </div>
    );
  }

  return null;
};

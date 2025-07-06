
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BalanceDisplay } from './BalanceDisplay';
import { WalletConnectionStatus } from './WalletConnectionStatus';

export const WalletStatus: React.FC = () => {
  const { connected } = useWallet();

  return (
    <div className="flex items-center space-x-4">
      {connected && <BalanceDisplay />}
      <WalletMultiButton className="wallet-button-gradient" />
      {!connected && (
        <div className="text-xs text-gray-400">
          Connect wallet to view balance
        </div>
      )}
    </div>
  );
};

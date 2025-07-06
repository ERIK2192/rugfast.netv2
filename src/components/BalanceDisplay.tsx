
import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Loader, Wallet } from 'lucide-react';

export const BalanceDisplay: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connected) {
        setBalance(null);
        return;
      }

      setLoading(true);
      try {
        console.log('RugFast.net - Fetching devnet SOL balance...');
        const balanceInLamports = await connection.getBalance(publicKey);
        const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
        setBalance(balanceInSol);
        console.log('RugFast.net - Devnet balance:', balanceInSol, 'SOL');
      } catch (error) {
        console.error('RugFast.net - Error fetching balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds when connected
    const interval = connected ? setInterval(fetchBalance, 10000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [publicKey, connected, connection]);

  if (!connected) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
      <Wallet className="h-4 w-4 text-cyan-400" />
      <div className="text-sm">
        <span className="text-gray-300">Balance: </span>
        {loading ? (
          <Loader className="h-3 w-3 animate-spin inline" />
        ) : balance !== null ? (
          <span className="text-cyan-400 font-medium">
            {balance.toFixed(4)} SOL
          </span>
        ) : (
          <span className="text-red-400">Error</span>
        )}
      </div>
      {balance !== null && balance < 0.25 && (
        <span className="text-xs text-orange-400">(Need 0.25+ SOL)</span>
      )}
    </div>
  );
};

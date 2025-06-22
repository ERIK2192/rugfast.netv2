
import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const { isAuthenticated, signInWithWallet, signOut, connected } = useAuth();

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await signOut();
    } else if (connected) {
      await signInWithWallet();
    }
  };

  return (
    <header className="bg-black border-b border-gray-800 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white">
          <span className="text-green-400">Rug</span>Fast
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-300 hover:text-green-400 transition-colors">
            Home
          </Link>
          <Link to="/create" className="text-gray-300 hover:text-green-400 transition-colors">
            Create Token
          </Link>
          <Link to="/discover" className="text-gray-300 hover:text-green-400 transition-colors">
            Discover
          </Link>
          <Link to="/wallet" className="text-gray-300 hover:text-green-400 transition-colors">
            My Tokens
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <WalletMultiButton className="!bg-green-500 hover:!bg-green-600" />
          {connected && (
            <Button 
              onClick={handleAuthAction}
              variant={isAuthenticated ? "outline" : "default"}
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
            >
              {isAuthenticated ? 'Sign Out' : 'Sign In'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

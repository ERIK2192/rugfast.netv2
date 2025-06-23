
import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 border-b border-cyan-500/20 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-cyan-400">RugFast</span>
        </Link>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/create" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">
            Create Token
          </Link>
          <Link to="/wallet" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">
            My Tokens
          </Link>
        </nav>

        <WalletMultiButton className="!bg-cyan-500 hover:!bg-cyan-600 !text-black !font-semibold !rounded-lg" />
      </div>
    </header>
  );
};

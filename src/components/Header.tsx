
import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-800/30 px-4 py-4 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold gradient-text">
          RugFast
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/create" className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-purple-800/20">
            Create token
          </Link>
          <button className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-purple-800/20">
            Trending tokens
          </button>
          <a 
            href="https://raydium.io/liquidity/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-purple-800/20"
          >
            Create liquidity
          </a>
          <a 
            href="https://raydium.io/liquidity/manage" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-purple-800/20"
          >
            Manage liquidity
          </a>
        </nav>

        <WalletMultiButton className="!bg-cyan-500 hover:!bg-cyan-600 !text-black !font-semibold !rounded-lg" />
      </div>
    </header>
  );
};

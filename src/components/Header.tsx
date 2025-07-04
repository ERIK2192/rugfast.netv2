
import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 sticky-header-fade border-b border-purple-800/30 px-4 py-4 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold gradient-text mr-8">
          RugFast
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/create" className="nav-link-gradient font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105">
            Create token
          </Link>
          <button className="nav-link-gradient font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105">
            Trending tokens
          </button>
          <a 
            href="https://raydium.io/liquidity/create-pool/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link-gradient font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Create liquidity
          </a>
          <a 
            href="https://raydium.io/portfolio/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link-gradient font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Manage liquidity
          </a>
        </nav>

        <div className="ml-8">
          <WalletMultiButton className="wallet-button-gradient" />
        </div>
      </div>
    </header>
  );
};

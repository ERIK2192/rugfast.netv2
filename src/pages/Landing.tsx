
import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Landing = () => {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Create Your Own Coin FAST</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 subtitle-gradient">
            Launch your own token on Solana in seconds. No coding required.
          </p>
          
          {!connected ? (
            <Card className="max-w-2xl mx-auto bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-lg mb-4">Please connect your wallet to continue</p>
                <div className="text-cyan-400 text-sm">
                  Click "Select Wallet" in the top right corner
                </div>
              </CardContent>
            </Card>
          ) : (
            <Link to="/create">
              <Button className="create-token-button font-semibold px-12 py-6 text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                Create Token
              </Button>
            </Link>
          )}
        </div>

        {/* How to use section */}
        <Card className="max-w-4xl mx-auto bg-gray-900/30 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">How to use Solana Token Creator</h2>
            <p className="text-lg mb-6 text-gray-300">Follow these simple steps:</p>
            
            <ol className="space-y-4 text-left text-gray-300">
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">1.</span>
                Connect your Solana wallet.
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">2.</span>
                Write the name you want for your Token.
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">3.</span>
                Write the symbol (max 8 characters)
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">4.</span>
                Upload the image for your token (max 5MB)
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">5.</span>
                Select the decimals quantity and total supply.
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">6.</span>
                Write the description you want for your SPL Token.
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">7.</span>
                Choose revoke options (additional fees apply).
              </li>
              <li className="flex items-start">
                <span className="text-cyan-400 font-bold mr-3">8.</span>
                Click Create and accept the transaction.
              </li>
            </ol>

            <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 mb-2">
                Base creation cost: <span className="text-cyan-400 font-bold">0.15 SOL</span>
              </p>
              <p className="text-gray-300 mb-2">
                Revoke Mint Authority: <span className="text-cyan-400 font-bold">+0.05 SOL</span>
              </p>
              <p className="text-gray-300 mb-2">
                Revoke Freeze Authority: <span className="text-cyan-400 font-bold">+0.05 SOL</span>
              </p>
              <p className="text-gray-300 font-semibold">
                Total with both revokes: <span className="text-cyan-400 font-bold">0.25 SOL</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Disclaimer */}
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-xs text-gray-400 max-w-6xl mx-auto leading-relaxed">
            RugFast.net is a token creation platform that allows users to generate Solana-based tokens instantly, with no coding required. RugFast.net does not issue, endorse, manage, or provide liquidity for any tokens created using our service. We do not provide financial advice, investment recommendations, or guarantees of value, price, or returns on any tokens. Tokens created on RugFast.net are not securities, and users are solely responsible for ensuring compliance with applicable laws and regulations in their jurisdiction. RugFast.net does not facilitate token trading, fundraising, or liquidity provision. By using RugFast.net, you acknowledge that creating tokens carries significant risks, including loss of funds, market volatility, and regulatory uncertainty. RugFast.net is provided "as is" without warranties of any kind. We are not responsible for any outcomes related to the use of our platform. By using RugFast.net, you accept full responsibility for your actions and any consequences that may arise. Always conduct your own due diligence before engaging with any token or project.
          </div>
          <div className="text-center mt-4 text-gray-500 text-xs">
            © 2025 RugFast | All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

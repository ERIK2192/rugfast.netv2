
import React, { useState, useEffect } from 'react';
import { TokenCard } from '@/components/TokenCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Wallet as WalletIcon, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type Token = Tables<'tokens'>;

export const Wallet = () => {
  const { isAuthenticated, walletAddress } = useAuth();
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      fetchUserTokens();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, walletAddress]);

  const fetchUserTokens = async () => {
    if (!walletAddress) return;

    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('creator_wallet', walletAddress)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserTokens(data);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="pt-6 text-center">
            <WalletIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Please connect and sign in with your wallet to view your tokens</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Wallet</h1>
            <p className="text-gray-400">Manage your created tokens</p>
          </div>
          <Link to="/create">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
          </Link>
        </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-lg p-3 mr-4">
                  <WalletIcon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{userTokens.length}</p>
                  <p className="text-gray-400">Created Tokens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-lg p-3 mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${userTokens.reduce((acc, token) => acc + Number(token.market_cap), 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400">Total Market Cap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-purple-500 rounded-lg p-3 mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${userTokens.reduce((acc, token) => acc + Number(token.volume_24h), 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400">24h Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User's Tokens */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : userTokens.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userTokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="py-12 text-center">
              <WalletIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No tokens created yet</h3>
              <p className="text-gray-500 mb-6">Start by creating your first memecoin</p>
              <Link to="/create">
                <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Token
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

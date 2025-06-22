
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TokenCard } from '@/components/TokenCard';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Token = Tables<'tokens'>;
type SortOption = 'newest' | 'popular' | 'volume';

export const Discover = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    fetchTokens();
  }, [sortBy]);

  const fetchTokens = async () => {
    setLoading(true);
    
    let query = supabase.from('tokens').select('*');
    
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('market_cap', { ascending: false });
        break;
      case 'volume':
        query = query.order('volume_24h', { ascending: false });
        break;
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setTokens(data);
    }
    setLoading(false);
  };

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortOptions = [
    { value: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
    { value: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'volume', label: 'Volume', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Discover Tokens</h1>
          <p className="text-gray-400 mb-6">Explore the latest memecoins on Solana</p>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`flex items-center gap-2 ${
                    sortBy === option.value 
                      ? 'bg-green-500 text-black' 
                      : 'border-gray-600 text-gray-300 hover:border-green-400 hover:text-green-400'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{tokens.length}</p>
            <p className="text-gray-400 text-sm">Total Tokens</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">24/7</p>
            <p className="text-gray-400 text-sm">Trading</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">0.25 SOL</p>
            <p className="text-gray-400 text-sm">Launch Fee</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">0.5%</p>
            <p className="text-gray-400 text-sm">Trading Fee</p>
          </div>
        </div>

        {/* Tokens Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTokens.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No tokens found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

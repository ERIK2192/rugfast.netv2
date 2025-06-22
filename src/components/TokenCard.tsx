
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type Token = Tables<'tokens'>;

interface TokenCardProps {
  token: Token;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <Link to={`/token/${token.id}`}>
      <Card className="bg-gray-900 border-gray-700 hover:border-green-400 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {token.image_url ? (
                <img 
                  src={token.image_url} 
                  alt={token.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  {token.symbol.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">{token.name}</h3>
                <p className="text-sm text-gray-400">${token.symbol}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {timeAgo(token.created_at || '')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Market Cap</p>
              <p className="text-white font-semibold">${formatNumber(Number(token.market_cap))}</p>
            </div>
            <div>
              <p className="text-gray-400">24h Volume</p>
              <p className="text-white font-semibold">${formatNumber(Number(token.volume_24h))}</p>
            </div>
          </div>
          
          {token.description && (
            <p className="text-gray-300 text-sm mt-3 line-clamp-2">
              {token.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

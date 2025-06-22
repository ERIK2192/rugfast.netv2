
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, MessageCircle, Settings, Copy, ExternalLink } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Token = Tables<'tokens'>;
type Comment = Tables<'comments'>;

export const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, walletAddress } = useAuth();
  const { toast } = useToast();
  
  const [token, setToken] = useState<Token | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  useEffect(() => {
    if (id) {
      fetchTokenData();
      fetchComments();
    }
  }, [id]);

  const fetchTokenData = async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setToken(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('token_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  };

  const addComment = async () => {
    if (!isAuthenticated || !walletAddress || !newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        token_id: id!,
        wallet_address: walletAddress,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      fetchComments();
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleTrade = (type: 'buy' | 'sell') => {
    toast({
      title: "Trading Coming Soon",
      description: "Direct trading will be available once Solana integration is complete",
    });
  };

  const handleTokenManagement = (action: string) => {
    toast({
      title: `${action} Coming Soon`,
      description: "Token management features will be available once Solana integration is complete",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Token Not Found</h2>
          <p className="text-gray-400">The token you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isCreator = walletAddress === token.creator_wallet;

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Info */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700 mb-8">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {token.image_url ? (
                    <img 
                      src={token.image_url} 
                      alt={token.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold">{token.name}</h1>
                    <p className="text-xl text-gray-400">${token.symbol}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Market Cap: ${Number(token.market_cap).toLocaleString()}
                      </Badge>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        24h Vol: ${Number(token.volume_24h).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {token.description && (
                  <p className="text-gray-300 mb-6">{token.description}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">Supply</p>
                    <p className="font-semibold">{Number(token.supply).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Creator</p>
                    <button 
                      onClick={() => copyAddress(token.creator_wallet)}
                      className="font-semibold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      {formatAddress(token.creator_wallet)}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Mint Address</p>
                    <button 
                      onClick={() => copyAddress(token.mint_address || '')}
                      className="font-semibold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      {formatAddress(token.mint_address || '')}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pool</p>
                    <button 
                      onClick={() => copyAddress(token.pool_address || '')}
                      className="font-semibold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      {formatAddress(token.pool_address || '')}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Token Management (for creators) */}
                {isCreator && (
                  <div className="border border-gray-700 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Token Management
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleTokenManagement('Revoke Freeze')}
                        className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        disabled={!token.freeze_authority}
                      >
                        {token.freeze_authority ? 'Revoke Freeze' : 'Freeze Revoked'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTokenManagement('Revoke Mint')}
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                        disabled={!token.mint_authority}
                      >
                        {token.mint_authority ? 'Revoke Mint' : 'Mint Revoked'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTokenManagement('Update Metadata')}
                        className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black"
                      >
                        Update Metadata
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isAuthenticated ? (
                  <div className="mb-6">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mb-3"
                    />
                    <Button 
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="bg-green-500 hover:bg-green-600 text-black"
                    >
                      Post Comment
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400 mb-6">Connect your wallet to comment</p>
                )}

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-semibold">
                          {formatAddress(comment.wallet_address)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(comment.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Price Chart Placeholder */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400">Chart integration coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Buy/Sell Panel */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Trade ${token.symbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buy Amount (SOL)</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button 
                    className="w-full mt-2 bg-green-500 hover:bg-green-600 text-black"
                    onClick={() => handleTrade('buy')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy {token.symbol}
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sell Amount ({token.symbol})</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button 
                    variant="outline"
                    className="w-full mt-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                    onClick={() => handleTrade('sell')}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Sell {token.symbol}
                  </Button>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Trading Fee: 0.5%</p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black"
                    onClick={() => window.open('https://raydium.io', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Trade on Raydium
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

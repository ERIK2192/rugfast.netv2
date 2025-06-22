
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenCard } from '@/components/TokenCard';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, DollarSign, Shield } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Token = Tables<'tokens'>;

export const Landing = () => {
  const [latestTokens, setLatestTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestTokens = async () => {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      if (!error && data) {
        setLatestTokens(data);
      }
      setLoading(false);
    };

    fetchLatestTokens();
  }, []);

  const features = [
    {
      icon: <DollarSign className="w-8 h-8 text-green-400" />,
      title: "Lowest Fees",
      description: "Only 0.25 SOL to launch vs 0.5 SOL elsewhere"
    },
    {
      icon: <Rocket className="w-8 h-8 text-blue-400" />,
      title: "Instant Trading",
      description: "Immediate Raydium integration for seamless trading"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-400" />,
      title: "Token Management",
      description: "Revoke freeze/mint authority and update metadata"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            Launch for <span className="text-green-400">0.25 SOL</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The fastest and cheapest way to launch your memecoin on Solana. 
            Instant Raydium integration with the lowest fees in the market.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/create">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-4">
                Create Token Now
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="outline" size="lg" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black px-8 py-4">
                Discover Tokens
              </Button>
            </Link>
          </div>

          {/* Pricing Comparison */}
          <Card className="bg-gray-900 border-gray-700 max-w-4xl mx-auto mb-16">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Why RugFast?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4 text-red-400">Other Platforms</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>Launch Fee: <span className="text-red-400">0.5 SOL</span></p>
                    <p>Trading Fee: <span className="text-red-400">1.0%</span></p>
                    <p>Complex Process</p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4 text-green-400">RugFast</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>Launch Fee: <span className="text-green-400">0.25 SOL</span></p>
                    <p>Trading Fee: <span className="text-green-400">0.5%</span></p>
                    <p>Instant & Simple</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Tokens */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Latest Tokens</h2>
            <Link to="/discover">
              <Button variant="outline" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
                View All
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
                  <div className="w-12 h-12 bg-gray-700 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestTokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

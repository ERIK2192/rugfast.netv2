
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const CreateToken = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { isAuthenticated, walletAddress } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    initialLiquidity: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initialLiquidity' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('token-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('token-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !isAuthenticated || !walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect and sign in with your wallet",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Create token in database (in real implementation, this would call a Solana edge function)
      const { data, error } = await supabase
        .from('tokens')
        .insert({
          creator_wallet: walletAddress,
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: imageUrl,
          initial_liquidity: formData.initialLiquidity,
          // These would be set by the actual Solana token creation process
          mint_address: `mock-${Date.now()}`,
          pool_address: `pool-${Date.now()}`,
          freeze_authority: walletAddress,
          mint_authority: walletAddress,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Token Created Successfully!",
        description: `${formData.name} (${formData.symbol}) has been launched`,
      });

      navigate(`/token/${data.id}`);
    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400">Please connect your wallet to create tokens</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Your Token</CardTitle>
            <p className="text-center text-gray-400">Launch fee: 0.25 SOL</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Token Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. DogeCoin"
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="symbol" className="text-white">Symbol *</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g. DOGE"
                    className="bg-gray-800 border-gray-600 text-white"
                    maxLength={8}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell people about your token..."
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="image" className="text-white">Token Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-gray-800 border-gray-600 text-white file:bg-green-500 file:text-black"
                />
              </div>

              <div>
                <Label htmlFor="initialLiquidity" className="text-white">Initial Liquidity (SOL)</Label>
                <Input
                  id="initialLiquidity"
                  name="initialLiquidity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.initialLiquidity}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
                <h3 className="font-semibold mb-2">Token Details:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Supply: 1,000,000,000 tokens</li>
                  <li>• Decimals: 9</li>
                  <li>• Network: Solana</li>
                  <li>• Trading: Immediate on Raydium</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={creating || !isAuthenticated}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3"
              >
                {creating ? 'Creating Token...' : 'Launch for 0.25 SOL'}
              </Button>
              
              {!isAuthenticated && (
                <p className="text-center text-red-400 text-sm">
                  Please sign in with your wallet to create tokens
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

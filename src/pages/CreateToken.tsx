
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSteps } from '@/components/LoadingSteps';
import { WalletConnectionStatus } from '@/components/WalletConnectionStatus';
import { 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  PublicKey 
} from '@solana/web3.js';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

export const CreateToken = () => {
  const navigate = useNavigate();
  const { connected, publicKey, sendTransaction, connecting } = useWallet();
  const { connection } = useConnection();
  const { isAuthenticated, walletAddress } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    supply: 1000000000,
    decimals: 9,
    revokeMint: true,
    revokeFreeze: true,
    revokeMetadata: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [creationSteps, setCreationSteps] = useState<Step[]>([
    { id: 'payment', label: 'Processing payment', status: 'pending' },
    { id: 'mint', label: 'Creating token mint', status: 'pending' },
    { id: 'metadata', label: 'Setting up metadata', status: 'pending' },
    { id: 'revokes', label: 'Revoking authorities', status: 'pending' },
    { id: 'verification', label: 'Verifying on-chain', status: 'pending' },
  ]);

  // Fee wallet address (replace with your actual fee collection wallet)
  const FEE_WALLET = new PublicKey('11111111111111111111111111111112'); // Replace with actual

  // Fixed flat fee of 0.25 SOL
  const FLAT_FEE_SOL = 0.25;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Sanitize inputs
    const sanitizedValue = value.replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    setFormData(prev => ({
      ...prev,
      [name]: ['supply', 'decimals'].includes(name) ? parseInt(sanitizedValue) || 0 : sanitizedValue
    }));
  };

  const handleCheckboxChange = (name: 'revokeMint' | 'revokeFreeze' | 'revokeMetadata') => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
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

  const createPaymentTransaction = async (): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');

    const totalCostLamports = FLAT_FEE_SOL * LAMPORTS_PER_SOL;
    
    // Check user balance
    const balance = await connection.getBalance(publicKey);
    if (balance < totalCostLamports) {
      throw new Error(`Insufficient SOL. Need ${FLAT_FEE_SOL} SOL, have ${balance / LAMPORTS_PER_SOL} SOL`);
    }

    // Create payment transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: FEE_WALLET,
        lamports: totalCostLamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    // Send and confirm transaction
    const signature = await sendTransaction(transaction, connection);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  };

  const updateStepStatus = (stepId: string, status: 'pending' | 'loading' | 'completed' | 'error') => {
    setCreationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !isAuthenticated || !walletAddress || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect and sign in with your wallet",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!formData.name.trim() || !formData.symbol.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.symbol.length > 8) {
      toast({
        title: "Invalid Symbol",
        description: "Symbol must be 8 characters or less",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    
    // Reset steps
    setCreationSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));

    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(imageFile);
      }

      // Step 1: Create and send payment transaction
      updateStepStatus('payment', 'loading');
      console.log('Creating payment transaction...');
      const paymentSignature = await createPaymentTransaction();
      console.log('Payment transaction confirmed:', paymentSignature);
      updateStepStatus('payment', 'completed');

      // Step 2: Call edge function to create actual token
      updateStepStatus('mint', 'loading');
      console.log('Calling token creation edge function...');
      const { data, error } = await supabase.functions.invoke('create-token', {
        body: {
          walletAddress: walletAddress,
          tokenData: {
            ...formData,
            imageUrl
          },
          transactionSignature: paymentSignature
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Token creation failed');
      }

      updateStepStatus('mint', 'completed');
      updateStepStatus('metadata', 'completed');
      updateStepStatus('revokes', 'completed');
      updateStepStatus('verification', 'completed');

      toast({
        title: "Token Created Successfully! 🎉",
        description: `${formData.name} (${formData.symbol}) has been launched for ${FLAT_FEE_SOL} SOL`,
      });

      // Show verification status
      if (data.token.verificationStatus) {
        const { mintRevoked, freezeRevoked, metadataRevoked } = data.token.verificationStatus;
        console.log('Verification Status:', { mintRevoked, freezeRevoked, metadataRevoked });
        
        if (formData.revokeMint && !mintRevoked) {
          toast({
            title: "Warning",
            description: "Mint authority revocation could not be verified",
            variant: "destructive",
          });
        }
      }

      console.log('Token created:', data.token);
      navigate(`/token/${data.token.id}`);

    } catch (error) {
      console.error('Error creating token:', error);
      
      // Update failed step
      const currentStep = creationSteps.find(step => step.status === 'loading');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
      
      let errorMessage = 'Failed to create token. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Insufficient SOL')) {
          errorMessage = error.message;
        } else if (error.message.includes('Rate limit')) {
          errorMessage = 'You can only create 1 token per minute. Please wait and try again.';
        } else if (error.message.includes('Network timeout')) {
          errorMessage = 'Network timeout detected. The system is retrying automatically.';
        }
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (!connected && !connecting) {
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
            <CardTitle className="text-2xl text-center gradient-text">Create Your Token</CardTitle>
            <p className="text-center text-gray-400">Launch fee: {FLAT_FEE_SOL} SOL (flat rate)</p>
            <WalletConnectionStatus />
          </CardHeader>
          
          <CardContent>
            {/* Enhanced Liquidity Warning */}
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
              <h3 className="text-red-400 font-bold text-lg mb-2">⚠️ CRITICAL NOTICE</h3>
              <p className="text-red-200 text-lg font-semibold mb-2">
                <strong>Liquidity must be added separately on Raydium!</strong>
              </p>
              <p className="text-red-300">
                This tool <strong>ONLY creates tokens</strong>. Your token will not be tradeable until you manually set up liquidity on Raydium DEX.
              </p>
            </div>

            {/* Token Creation Progress */}
            {creating && (
              <div className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Creating Your Token...</h3>
                <LoadingSteps steps={creationSteps} />
              </div>
            )}

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
                    maxLength={50}
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supply" className="text-white">Total Supply *</Label>
                  <Input
                    id="supply"
                    name="supply"
                    type="number"
                    min="1"
                    max="1000000000000"
                    value={formData.supply}
                    onChange={handleInputChange}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="decimals" className="text-white">Decimals *</Label>
                  <Input
                    id="decimals"
                    name="decimals"
                    type="number"
                    min="0"
                    max="9"
                    value={formData.decimals}
                    onChange={handleInputChange}
                    className="bg-gray-800 border-gray-600 text-white"
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
                  maxLength={500}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="image" className="text-white">Token Image (Max 5MB)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-gray-800 border-gray-600 text-white file:bg-cyan-500 file:text-black"
                />
              </div>

              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Security Options (Recommended)</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revokeMint"
                    checked={formData.revokeMint}
                    onCheckedChange={handleCheckboxChange('revokeMint')}
                  />
                  <Label htmlFor="revokeMint" className="text-white">
                    Revoke Mint Authority (Recommended)
                  </Label>
                </div>
                <p className="text-sm text-gray-400 ml-6">Prevents creation of additional tokens, ensuring fixed supply and increasing trust.</p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revokeFreeze"
                    checked={formData.revokeFreeze}
                    onCheckedChange={handleCheckboxChange('revokeFreeze')}
                  />
                  <Label htmlFor="revokeFreeze" className="text-white">
                    Revoke Freeze Authority (Recommended)
                  </Label>
                </div>
                <p className="text-sm text-gray-400 ml-6">Prevents freezing of user wallets, ensuring tokens remain tradeable.</p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revokeMetadata"
                    checked={formData.revokeMetadata}
                    onCheckedChange={handleCheckboxChange('revokeMetadata')}
                  />
                  <Label htmlFor="revokeMetadata" className="text-white">
                    Revoke Metadata Authority (Recommended)
                  </Label>
                </div>
                <p className="text-sm text-gray-400 ml-6">Locks token metadata (name, symbol, image), preventing post-launch changes and increasing trust.</p>
              </div>

              <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
                <h3 className="font-semibold mb-2 text-white">Simple Flat Rate Pricing:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li className="font-semibold text-cyan-400">• Total: {FLAT_FEE_SOL} SOL (includes all features)</li>
                  <li className="text-xs text-gray-400">• Token creation, metadata, and all revoke options included</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={creating || !isAuthenticated || connecting}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3"
              >
                {creating ? 'Creating Token...' : 
               connecting ? 'Connecting Wallet...' :
               `Launch for ${FLAT_FEE_SOL} SOL`}
            </Button>
            
            {!isAuthenticated && !connecting && (
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


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from "https://esm.sh/@solana/web3.js@1.87.6"
import { 
  createMint, 
  createAssociatedTokenAccount, 
  mintTo, 
  setAuthority, 
  AuthorityType,
  TOKEN_PROGRAM_ID
} from "https://esm.sh/@solana/spl-token@0.4.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTokenRequest {
  walletAddress: string;
  tokenData: {
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    supply: number;
    decimals: number;
    revokeMint: boolean;
    revokeFreeze: boolean;
    revokeMetadata: boolean;
  };
  transactionSignature: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting token creation process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const { walletAddress, tokenData, transactionSignature }: CreateTokenRequest = await req.json();
    
    console.log(`Creating token for wallet: ${walletAddress}`);
    console.log(`Token data:`, tokenData);

    // Validate inputs
    if (!walletAddress || !tokenData.name || !tokenData.symbol) {
      throw new Error('Missing required fields');
    }

    // Check rate limiting (1 token per wallet per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentTokens, error: rateLimitError } = await supabase
      .from('tokens')
      .select('id')
      .eq('creator_wallet', walletAddress)
      .gte('created_at', oneMinuteAgo);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('Rate limit check failed');
    }

    if (recentTokens && recentTokens.length > 0) {
      throw new Error('Rate limit exceeded: Only 1 token per wallet per minute allowed');
    }

    // Initialize Solana connection
    const connection = new Connection(
      Deno.env.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com',
      'confirmed'
    );

    // Create fee collection wallet (in production, use a secure keypair)
    const feeWallet = Keypair.generate(); // Replace with your actual fee wallet
    const userWallet = new PublicKey(walletAddress);

    console.log('Creating SPL token...');

    // Create the mint account
    const mintKeypair = Keypair.generate();
    const mint = await createMint(
      connection,
      mintKeypair, // Payer (temporary, in production use fee wallet)
      userWallet, // Mint authority (will be revoked if requested)
      tokenData.revokeFreeze ? null : userWallet, // Freeze authority
      tokenData.decimals,
      mintKeypair
    );

    console.log(`Token mint created: ${mint.toBase58()}`);

    // Create associated token account for the user
    const userTokenAccount = await createAssociatedTokenAccount(
      connection,
      mintKeypair, // Payer
      mint,
      userWallet
    );

    console.log(`User token account created: ${userTokenAccount.toBase58()}`);

    // Mint initial supply to user
    await mintTo(
      connection,
      mintKeypair, // Payer
      mint,
      userTokenAccount,
      userWallet, // Mint authority
      tokenData.supply * Math.pow(10, tokenData.decimals)
    );

    console.log(`Minted ${tokenData.supply} tokens to user account`);

    // Revoke authorities if requested
    if (tokenData.revokeMint) {
      console.log('Revoking mint authority...');
      await setAuthority(
        connection,
        mintKeypair, // Payer
        mint,
        userWallet, // Current authority
        AuthorityType.MintTokens,
        null // Set to null to revoke
      );
      console.log('Mint authority revoked');
    }

    // Note: Freeze authority is set during mint creation
    // Metadata authority revocation would require Metaplex integration

    // Store token in database
    const { data: tokenRecord, error: dbError } = await supabase
      .from('tokens')
      .insert({
        creator_wallet: walletAddress,
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        image_url: tokenData.imageUrl,
        supply: tokenData.supply,
        mint_address: mint.toBase58(),
        mint_authority: tokenData.revokeMint ? null : walletAddress,
        freeze_authority: tokenData.revokeFreeze ? null : walletAddress,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Token created successfully:', tokenRecord);

    return new Response(
      JSON.stringify({
        success: true,
        token: {
          ...tokenRecord,
          mintAddress: mint.toBase58(),
          userTokenAccount: userTokenAccount.toBase58(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Token creation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Token creation failed'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

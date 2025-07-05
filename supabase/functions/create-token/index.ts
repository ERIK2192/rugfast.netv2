
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
import { Metaplex, keypairIdentity, bundlrStorage } from "https://esm.sh/@metaplex-foundation/js@0.20.1"

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

// Fixed flat fee of 0.25 SOL
const FLAT_FEE_SOL = 0.25;

// Enhanced retry mechanism
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('insufficient funds') || 
          error.message.includes('blockhash not found')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

// Custom error messages for common Solana errors
function getCustomErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('insufficient funds')) {
    return 'Insufficient SOL balance. Please add more SOL to your wallet.';
  }
  if (message.includes('blockhash not found')) {
    return 'Network congestion detected. Please try again in a few moments.';
  }
  if (message.includes('timeout') || message.includes('rpc')) {
    return 'Network timeout. Retrying automatically...';
  }
  if (message.includes('signature verification failed')) {
    return 'Transaction signature failed. Please try again.';
  }
  
  return error.message;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('RugFast.net - Starting devnet token creation process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const { walletAddress, tokenData, transactionSignature }: CreateTokenRequest = await req.json();
    
    console.log(`RugFast.net - Creating token for wallet: ${walletAddress}`);
    console.log(`RugFast.net - Token data:`, tokenData);

    // Validate inputs with enhanced sanitization
    if (!walletAddress || !tokenData.name || !tokenData.symbol) {
      throw new Error('Missing required fields');
    }

    // Sanitize inputs to prevent XSS
    const sanitizedName = tokenData.name.replace(/<[^>]*>/g, '').trim();
    const sanitizedSymbol = tokenData.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const sanitizedDescription = tokenData.description?.replace(/<[^>]*>/g, '').trim() || '';

    if (sanitizedName.length === 0 || sanitizedSymbol.length === 0) {
      throw new Error('Invalid token name or symbol after sanitization');
    }

    // Enhanced rate limiting check
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

    // Initialize Solana connection with devnet explicitly
    const connection = await withRetry(async () => {
      const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
      console.log('RugFast.net - Connected to Solana Devnet');
      
      // Test connection
      await conn.getLatestBlockhash();
      return conn;
    });

    // Get fee wallet from environment variable (your dedicated wallet's private key)
    const feeWalletSecret = Deno.env.get('FEE_WALLET_PRIVATE_KEY');
    if (!feeWalletSecret) {
      throw new Error('Fee wallet not configured');
    }

    const feeWallet = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(feeWalletSecret))
    );
    const userWallet = new PublicKey(walletAddress);

    console.log(`RugFast.net - Fee wallet public key: ${feeWallet.publicKey.toBase58()}`);
    console.log('RugFast.net - Creating SPL token on devnet with retry logic...');

    // Verify the fee wallet matches expected address
    const expectedFeeWallet = 'FTVkFUZRnQF7LxfNKE2dnCv4AJsMnMYUWYe3a6m1nwR7';
    if (feeWallet.publicKey.toBase58() !== expectedFeeWallet) {
      console.warn(`RugFast.net - Fee wallet mismatch. Expected: ${expectedFeeWallet}, Got: ${feeWallet.publicKey.toBase58()}`);
    }

    // Create the mint account with retry
    const mintKeypair = Keypair.generate();
    const mint = await withRetry(async () => {
      return await createMint(
        connection,
        feeWallet, // Use fee wallet as payer
        userWallet, // Mint authority (will be revoked if requested)
        tokenData.revokeFreeze ? null : userWallet, // Freeze authority
        tokenData.decimals,
        mintKeypair
      );
    });

    console.log(`RugFast.net - Token mint created on devnet: ${mint.toBase58()}`);

    // Create associated token account for the user with retry
    const userTokenAccount = await withRetry(async () => {
      return await createAssociatedTokenAccount(
        connection,
        feeWallet, // Payer
        mint,
        userWallet
      );
    });

    console.log(`RugFast.net - User token account created: ${userTokenAccount.toBase58()}`);

    // Mint initial supply to user with retry
    await withRetry(async () => {
      return await mintTo(
        connection,
        feeWallet, // Payer
        mint,
        userTokenAccount,
        userWallet, // Mint authority
        tokenData.supply * Math.pow(10, tokenData.decimals)
      );
    });

    console.log(`RugFast.net - Minted ${tokenData.supply} tokens to user account`);

    // Initialize Metaplex for metadata operations
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(feeWallet))
      .use(bundlrStorage());

    let metadataUri = null;
    let metadataRevoked = false;

    // Create metadata if image is provided
    if (tokenData.imageUrl) {
      console.log('RugFast.net - Creating token metadata on devnet...');
      try {
        const { nft } = await withRetry(async () => {
          return await metaplex.nfts().create({
            uri: tokenData.imageUrl!,
            name: sanitizedName,
            symbol: sanitizedSymbol,
            sellerFeeBasisPoints: 0,
            useNewMint: mint,
            updateAuthority: tokenData.revokeMetadata ? null : userWallet,
          });
        });
        
        metadataUri = nft.uri;
        console.log('RugFast.net - Metadata created:', metadataUri);
      } catch (error) {
        console.error('RugFast.net - Metadata creation failed:', error);
        // Continue without metadata if it fails
      }
    }

    // Revoke authorities if requested
    if (tokenData.revokeMint) {
      console.log('RugFast.net - Revoking mint authority...');
      await withRetry(async () => {
        return await setAuthority(
          connection,
          feeWallet, // Payer
          mint,
          userWallet, // Current authority
          AuthorityType.MintTokens,
          null // Set to null to revoke
        );
      });
      console.log('RugFast.net - Mint authority revoked');
    }

    // Revoke metadata authority using Metaplex
    if (tokenData.revokeMetadata && metadataUri) {
      console.log('RugFast.net - Revoking metadata authority...');
      try {
        await withRetry(async () => {
          const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
          return await metaplex.nfts().update({
            nftOrSft: nft,
            updateAuthority: null,
          });
        });
        metadataRevoked = true;
        console.log('RugFast.net - Metadata authority revoked');
      } catch (error) {
        console.error('RugFast.net - Metadata authority revocation failed:', error);
        // Continue even if metadata revocation fails
      }
    }

    // Verify revocations on-chain
    const mintInfo = await connection.getAccountInfo(mint);
    const mintAccount = await connection.getParsedAccountInfo(mint);
    
    console.log('RugFast.net - Verifying revocations on-chain...');
    const actualMintAuthority = mintAccount.value?.data?.parsed?.info?.mintAuthority;
    const actualFreezeAuthority = mintAccount.value?.data?.parsed?.info?.freezeAuthority;
    
    console.log('RugFast.net - Actual mint authority:', actualMintAuthority);
    console.log('RugFast.net - Actual freeze authority:', actualFreezeAuthority);

    // Store token in database with verification results
    const { data: tokenRecord, error: dbError } = await supabase
      .from('tokens')
      .insert({
        creator_wallet: walletAddress,
        name: sanitizedName,
        symbol: sanitizedSymbol,
        description: sanitizedDescription,
        image_url: tokenData.imageUrl,
        supply: tokenData.supply,
        mint_address: mint.toBase58(),
        mint_authority: tokenData.revokeMint ? null : walletAddress,
        freeze_authority: tokenData.revokeFreeze ? null : walletAddress,
        metadata_uri: metadataUri,
        revocations_verified: {
          mint: tokenData.revokeMint ? (actualMintAuthority === null) : true,
          freeze: tokenData.revokeFreeze ? (actualFreezeAuthority === null) : true,
          metadata: tokenData.revokeMetadata ? metadataRevoked : true
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('RugFast.net - Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('RugFast.net - Token created successfully on devnet:', tokenRecord);

    return new Response(
      JSON.stringify({
        success: true,
        network: 'devnet',
        token: {
          ...tokenRecord,
          mintAddress: mint.toBase58(),
          userTokenAccount: userTokenAccount.toBase58(),
          verificationStatus: {
            mintRevoked: tokenData.revokeMint ? (actualMintAuthority === null) : false,
            freezeRevoked: tokenData.revokeFreeze ? (actualFreezeAuthority === null) : false,
            metadataRevoked: tokenData.revokeMetadata ? metadataRevoked : false
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('RugFast.net - Token creation error:', error);
    
    const customMessage = getCustomErrorMessage(error as Error);
    
    return new Response(
      JSON.stringify({
        success: false,
        network: 'devnet',
        error: customMessage,
        originalError: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

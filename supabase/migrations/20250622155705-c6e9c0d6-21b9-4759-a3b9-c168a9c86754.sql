
-- Enable authentication schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for wallet authentication
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create tokens table
CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  mint_address TEXT UNIQUE,
  pool_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  market_cap DECIMAL DEFAULT 0,
  volume_24h DECIMAL DEFAULT 0,
  freeze_authority TEXT,
  mint_authority TEXT,
  supply BIGINT DEFAULT 1000000000,
  initial_liquidity DECIMAL DEFAULT 0
);

-- Enable RLS on tokens
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for tokens
CREATE POLICY "Anyone can view tokens" 
  ON public.tokens 
  FOR SELECT 
  TO PUBLIC 
  USING (true);

CREATE POLICY "Authenticated users can create tokens" 
  ON public.tokens 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Token creators can update their tokens" 
  ON public.tokens 
  FOR UPDATE 
  TO authenticated 
  USING (creator_wallet = (SELECT wallet_address FROM profiles WHERE id = auth.uid()));

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.tokens(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Anyone can view comments" 
  ON public.comments 
  FOR SELECT 
  TO PUBLIC 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (wallet_address = (SELECT wallet_address FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Comment authors can update their comments" 
  ON public.comments 
  FOR UPDATE 
  TO authenticated 
  USING (wallet_address = (SELECT wallet_address FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Comment authors can delete their comments" 
  ON public.comments 
  FOR DELETE 
  TO authenticated 
  USING (wallet_address = (SELECT wallet_address FROM profiles WHERE id = auth.uid()));

-- Create storage bucket for token images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('token-images', 'token-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view token images" 
  ON storage.objects 
  FOR SELECT 
  TO PUBLIC 
  USING (bucket_id = 'token-images');

CREATE POLICY "Authenticated users can upload token images" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'token-images');

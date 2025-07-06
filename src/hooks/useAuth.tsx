
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('RugFast.net - Auth state changed:', event, session ? 'Session active' : 'No session');
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    const autoAuthenticate = async () => {
      if (connected && publicKey && !session) {
        console.log('RugFast.net - Auto-authenticating wallet connection...');
        await signInWithWallet();
      }
    };

    autoAuthenticate();
  }, [connected, publicKey, session]);

  const signInWithWallet = async () => {
    if (!publicKey) return { error: 'No wallet connected' };
    
    try {
      const walletAddress = publicKey.toBase58();
      console.log('RugFast.net - Signing in wallet:', walletAddress);
      
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) return { error };

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          wallet_address: walletAddress,
        });
        console.log('RugFast.net - Wallet authenticated successfully');
      }

      return { data, error: null };
    } catch (error) {
      console.error('RugFast.net - Auth error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithWallet,
    signOut,
    isAuthenticated: !!session,
    walletAddress: publicKey?.toBase58(),
    connected,
  };
};

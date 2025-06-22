
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
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithWallet = async () => {
    if (!publicKey) return { error: 'No wallet connected' };
    
    try {
      const walletAddress = publicKey.toBase58();
      
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) return { error };

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          wallet_address: walletAddress,
        });
      }

      return { data, error: null };
    } catch (error) {
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

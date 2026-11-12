

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { registerWithoutVerification, confirmUnverifiedUser } from '@/lib/auth.functions';

const AuthContext = createContext<any>({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email/Password Sign Up (email verification disconnected)
  const signUp = async (email: string, password: string, metadata: { fullName?: string; avatarUrl?: string } = {}) => {
    const res = await registerWithoutVerification({
      data: {
        name: metadata?.fullName || email.split('@')[0] || 'Investor',
        email,
        password,
      },
    });
    if (!res.ok) throw new Error(res.error);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error && /email not confirmed|not confirmed/i.test(error.message)) {
      const confirmed = await confirmUnverifiedUser({ data: { email } }).catch(() => null);
      if (confirmed?.ok) {
        const retry = await supabase.auth.signInWithPassword({ email, password });
        data = retry.data;
        error = retry.error;
      }
    }
    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Get Current User
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  // Check if Email is Verified (suspended while mailbox is inactive)
  const isEmailVerified = () => {
    return true;
  };

  // Get User Profile from Database
  const getUserProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

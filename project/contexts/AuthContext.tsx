import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Creating default user profile for:', userId);
          const { data: session } = await supabase.auth.getSession();
          if (session?.user) {
            const defaultUser: User = {
              id: userId,
              email: session.user.email || '',
              role: 'customer',
              full_name: session.user.user_metadata?.full_name || 'New User',
              phone: undefined,
              avatar_url: undefined,
              location: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
            };
            
            // Try to insert the default user profile
            const { error: insertError } = await supabase
              .from('users')
              .insert(defaultUser);
            
            if (insertError) {
              console.error('Error creating user profile:', insertError);
              // If insert fails (e.g., Supabase not configured), use the default user
              setUser(defaultUser);
            } else {
              setUser(defaultUser);
            }
          }
        }
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message === 'Supabase not configured') {
        // For demo purposes, create a mock user when Supabase is not configured
        const mockUser: User = {
          id: 'mock-user-id',
          email,
          role: 'customer',
          full_name: 'Demo User',
          phone: undefined,
          avatar_url: undefined,
          location: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        };
        setUser(mockUser);
        setSession({ user: { id: mockUser.id }, access_token: 'mock-token' } as any);
        setLoading(false);
        return;
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      if (error.message === 'Supabase not configured') {
        // For demo purposes, create a mock user when Supabase is not configured
        const mockUser: User = {
          id: 'mock-user-id',
          email,
          role: userData.role || 'customer',
          full_name: userData.full_name || 'Demo User',
          phone: userData.phone || undefined,
          avatar_url: undefined,
          location: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        };
        setUser(mockUser);
        setSession({ user: { id: mockUser.id }, access_token: 'mock-token' } as any);
        setLoading(false);
        return;
      }
      throw error;
    }

    // Create user profile with the actual user ID from auth
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          ...userData,
        });
      
      if (profileError) {
        if (profileError.message === 'Supabase not configured') {
          return; // Already handled above
        }
        throw profileError;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && error.message !== 'Supabase not configured') {
      throw error;
    }
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!session?.user.id) throw new Error('No user logged in');

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id);

    if (error) throw error;

    // Update local user state
    setUser(current => current ? { ...current, ...updates } : null);
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Use environment variables or provide default values for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
                          supabaseUrl !== 'https://your-project.supabase.co' && 
                          supabaseAnonKey && 
                          supabaseAnonKey !== 'your-anon-key';

if (!hasValidCredentials) {
  console.warn('Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

// Create a mock client if credentials are not configured
const createMockClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ eq: () => ({ data: null, error: { message: 'Supabase not configured' } }) }),
    }),
  } as any;
};

export const supabase = hasValidCredentials 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createMockClient();
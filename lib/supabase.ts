import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                   Constants.manifest?.extra?.supabaseUrl ||
                   process.env.EXPO_PUBLIC_SUPABASE_URL || 
                   'https://pofgpoktfwwrpkgzwuwa.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                       Constants.manifest?.extra?.supabaseAnonKey ||
                       process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZmdwb2t0Znd3cnBrZ3p3dXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDI0OTgsImV4cCI6MjA2NTMxODQ5OH0.Exfvy_9M-h5W-4QEKZvS3m4ikrbPG3ms-NtAQQbSDs4';

// Add connection timeout and retry logic
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: (url, options = {}) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};
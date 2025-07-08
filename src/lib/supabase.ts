import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yblxawsyfegkauoscfwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibHhhd3N5ZmVna2F1b3NjZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzgzOTIsImV4cCI6MjA2NzA1NDM5Mn0.lWRuT4VSANRJH9H_6pVTnfdqSHvGZmOpMVk2jQYfLKI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types for Supabase Auth
export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ebpziaafxepevcwwbsdk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHppYWFmeGVwZXZjd3dic2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjE4NDgsImV4cCI6MjEwMjY5Nzg0OH0.34ExhtgSl-XlcCJuQgoZUCPYB9ghcQYY4LsjWFS8vGU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;

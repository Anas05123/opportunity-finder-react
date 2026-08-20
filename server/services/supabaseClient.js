import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ebpziaafxepevcwwbsdk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHppYWFmeGVwZXZjd3dic2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjE4NDgsImV4cCI6MjEwMjY5Nzg0OH0.34ExhtgSl-XlcCJuQgoZUCPYB9ghcQYY4LsjWFS8vGU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

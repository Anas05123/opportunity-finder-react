import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ebpziaafxepevcwwbsdk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

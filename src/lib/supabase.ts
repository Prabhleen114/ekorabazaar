import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceRoleKey || 'placeholder', 
  {

  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl !== 'your_supabase_url_here' && 
  supabaseServiceRoleKey && supabaseServiceRoleKey !== 'your_service_role_key_here'
);

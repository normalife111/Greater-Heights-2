import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Browser client using the public anon key only. Row Level Security does the access control. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isBackendConfigured = Boolean(supabase);

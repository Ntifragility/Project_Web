/**
 * @file SupabaseClient.ts
 * @description Singleton Supabase client initialized from Vite environment variables.
 * Provides the shared client instance used by VaultService and AdminController.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
        '[SupabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
        'Falling back to offline mode. Set these in .env.local to enable Supabase.'
    );
}

export const supabase: SupabaseClient = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder-key'
);

/** Returns true when valid Supabase credentials are configured */
export function isSupabaseConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder'));
}

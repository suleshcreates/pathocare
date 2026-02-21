import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.warn('Supabase URL is missing. Please set VITE_SUPABASE_URL in your .env file.');
}

if (supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('Supabase Anon Key is missing. Please set VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Validate credentials before creating client to prevent app crash
const isValidUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
const isConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isConfigured) {
    console.warn('Supabase is not configured. Please check your .env file.');
}

// Export a robust client or a fallback that logs errors when used
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key'); // Fallback to prevent crash, will fail on actual calls

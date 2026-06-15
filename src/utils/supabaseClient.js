import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. ' +
    'Please verify your .env file or deployment setup.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const setSupabaseUsername = (username) => {
  if (username) {
    if (supabase.rest && supabase.rest.headers) {
      if (typeof supabase.rest.headers.set === 'function') {
        supabase.rest.headers.set('x-username', username);
      } else {
        supabase.rest.headers['x-username'] = username;
      }
    }
    if (supabase.headers) {
      supabase.headers['x-username'] = username;
    }
  } else {
    if (supabase.rest && supabase.rest.headers) {
      if (typeof supabase.rest.headers.delete === 'function') {
        supabase.rest.headers.delete('x-username');
      } else {
        delete supabase.rest.headers['x-username'];
      }
    }
    if (supabase.headers) {
      delete supabase.headers['x-username'];
    }
  }
};


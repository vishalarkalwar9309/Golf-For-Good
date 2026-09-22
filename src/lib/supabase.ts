import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL as string)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL as string)) ||
  '';
const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY as string)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY as string)) ||
  '';

let client: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '') {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('Supabase URL or Anon Key is missing or empty.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');

const dummyAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase is not configured.') }),
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase is not configured.') }),
  signOut: async () => ({ error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      if (prop === 'auth') {
        return dummyAuth;
      }
      if (prop === 'from' || prop === 'storage' || prop === 'rpc') {
        return () => {
          console.warn(`Supabase ${String(prop)} called but client is not configured.`);
          const chainable: any = {
            select: () => chainable,
            insert: () => chainable,
            update: () => chainable,
            delete: () => chainable,
            upsert: () => chainable,
            eq: () => chainable,
            in: () => chainable,
            order: () => chainable,
            limit: () => chainable,
            single: async () => ({ data: null, error: new Error('Supabase not configured') }),
            maybeSingle: async () => ({ data: null, error: null }),
            then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
          };
          return chainable;
        };
      }
      return undefined;
    }
    return (client as any)[prop];
  }
});

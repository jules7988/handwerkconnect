import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = CONFIG?.SUPABASE_URL;
const anonKey = CONFIG?.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase config. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
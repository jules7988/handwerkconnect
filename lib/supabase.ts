import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, storage: AsyncStorage as any },
    })
  : null;

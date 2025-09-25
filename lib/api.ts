import { supabase } from './supabase';
import { CONFIG } from './config';
export type Role = 'apprentice' | 'company';

export async function getFeed(role: Role) {
  if (CONFIG.MOCK_MODE || !supabase) {
    return {
      data: [
        { id: 'c1', title: 'Schreinerei Holzfreund', city: 'München', occupation: 'Tischler/in', bio: 'Azubi ab Sept. gesucht – moderne CNC!', avatar: null },
        { id: 'c2', title: 'Elektro Stark GmbH',     city: 'Augsburg', occupation: 'Elektroniker/in', bio: 'Team mit 20 Leuten, coole Baustellen', avatar: null },
      ]
    };
  }
  const { data, error } = await supabase.from('company_profiles').select('*').limit(20);
  if (error) return { error };
  return { data };
}

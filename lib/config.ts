import Constants from 'expo-constants';
const extra = (Constants.expoConfig?.extra || {}) as any;
export const CONFIG = {
  SUPABASE_URL: extra.SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: extra.SUPABASE_ANON_KEY as string | undefined,
  EDGE_BASE_URL: extra.EDGE_BASE_URL as string,
  MOCK_MODE: String(extra.MOCK_MODE || "true") === "true",
};

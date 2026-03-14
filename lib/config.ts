export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined,

  // optional – falls du es nutzt:
  EDGE_BASE_URL: process.env.EXPO_PUBLIC_EDGE_BASE_URL as string | undefined,

  // default: false (du kannst "true" setzen wenn du willst)
  MOCK_MODE: (process.env.EXPO_PUBLIC_MOCK_MODE ?? "false") === "true",
};

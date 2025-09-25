import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "HandwerkConnect",
  slug: "handwerkconnect",
  scheme: "handwerkconnect",
  version: "0.1.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: { supportsTablet: false },
  android: { adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#ffffff" } },
  web: { bundler: "metro" },
  plugins: ["expo-router"],
  experiments: { typedRoutes: true },
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    EDGE_BASE_URL: process.env.EDGE_BASE_URL || "http://localhost:54321/functions/v1",
    MOCK_MODE: process.env.MOCK_MODE ?? "true"
  }
});

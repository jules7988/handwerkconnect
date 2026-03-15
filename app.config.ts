import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "HandwerkConnect",
  slug: "handwerkconnect",
  scheme: "handwerkconnect",
  version: "0.1.2",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.jules88.handwerkconnect",

    // Neuer TestFlight Build
    buildNumber: "14",

    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.jules88.handwerkconnect"
  },

  web: {
    bundler: "metro"
  },

  plugins: ["expo-router"],

  experiments: {
    typedRoutes: true
  },

  extra: {
    eas: {
      projectId: "23e8627d-112f-4fee-91cc-7838857bafaa"
    },

    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    EDGE_BASE_URL:
      process.env.EXPO_PUBLIC_EDGE_BASE_URL ||
      "http://localhost:54321/functions/v1",

    MOCK_MODE:
      process.env.NODE_ENV === "development"
        ? (process.env.EXPO_PUBLIC_MOCK_MODE ?? "true")
        : "false"
  }
});
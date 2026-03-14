import { Stack } from "expo-router";
import { View, Text } from "react-native";
import { CONFIG } from "@/lib/config";

export default function RootLayout() {
  // 🔒 Production Guard: verhindert mysteriösen Crash,
  // wenn EAS Secrets nicht gesetzt sind
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Konfiguration fehlt
        </Text>

        <Text style={{ textAlign: "center" }}>
          EXPO_PUBLIC_SUPABASE_URL oder
          EXPO_PUBLIC_SUPABASE_ANON_KEY sind im
          Production-Build nicht gesetzt.
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTitle: "HandwerkConnect" }}>
      <Stack.Screen name="auth/welcome" options={{ title: "Start" }} />
      <Stack.Screen name="auth/sign-in" options={{ title: "Login" }} />
      <Stack.Screen name="auth/sign-up" options={{ title: "Registrierung" }} />
      <Stack.Screen name="legal/consent" options={{ title: "Einwilligung" }} />
      <Stack.Screen name="azubi/profile" options={{ title: "Azubi Profil" }} />
      <Stack.Screen name="company/profile" options={{ title: "Betrieb Profil" }} />
    </Stack>
  );
}
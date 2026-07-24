import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

import { CONFIG } from '@/lib/config';

export default function RootLayout() {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Konfiguration fehlt
        </Text>

        <Text style={{ textAlign: 'center' }}>
          EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_ANON_KEY sind im
          Production-Build nicht gesetzt.
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTitle: 'AzuConnect' }}>
      <Stack.Screen
        name="azubi/profile"
        options={{ title: 'Azubi-Profil' }}
      />

      <Stack.Screen
        name="company/profile"
        options={{ title: 'Betriebsprofil' }}
      />
    </Stack>
  );
}
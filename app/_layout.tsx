import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitle: 'HandwerkConnect' }}>
      <Stack.Screen name="auth/welcome" options={{ title: 'Start' }} />
      <Stack.Screen name="auth/sign-in" options={{ title: 'Login' }} />
      <Stack.Screen name="auth/sign-up" options={{ title: 'Registrierung' }} />
      <Stack.Screen name="legal/consent" options={{ title: 'Einwilligung' }} />
      <Stack.Screen name="azubi/profile" options={{ title: 'Azubi Profil' }} />
      <Stack.Screen name="company/profile" options={{ title: 'Betrieb Profil' }} />
    </Stack>
  );
}

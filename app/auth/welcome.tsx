import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>HandwerkConnect</Text>
      <Text style={{ fontSize: 16, opacity: 0.8 }}>Wähle deine Rolle</Text>

      <Pressable
        onPress={() => router.push({ pathname: '/auth/sign-up', params: { role: 'azubi' } })}
        style={{ padding: 14, borderWidth: 1, borderRadius: 10 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Ich bin Azubi</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push({ pathname: '/auth/sign-up', params: { role: 'betrieb' } })}
        style={{ padding: 14, borderWidth: 1, borderRadius: 10 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Ich bin Betrieb</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/auth/sign-in')} style={{ padding: 14 }}>
        <Text style={{ fontSize: 16, textDecorationLine: 'underline' }}>
          Ich habe schon einen Account
        </Text>
      </Pressable>
    </View>
  );
}

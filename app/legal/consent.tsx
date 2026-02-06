import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function Consent() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'azubi' | 'betrieb' }>();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const canContinue = terms && privacy;

  return (
    <View style={{ flex: 1, padding: 24, gap: 14 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Einwilligung</Text>

      <Pressable onPress={() => setTerms(!terms)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>{terms ? '☑︎' : '☐'}</Text>
        <Text>Ich akzeptiere die AGB (Platzhalter)</Text>
      </Pressable>

      <Pressable onPress={() => setPrivacy(!privacy)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>{privacy ? '☑︎' : '☐'}</Text>
        <Text>Ich akzeptiere die Datenschutzerklärung (Platzhalter)</Text>
      </Pressable>

      <Pressable
        disabled={!canContinue}
        onPress={() => router.replace({ pathname: role === 'azubi' ? '/azubi/profile' : '/company/profile' })}
        style={{
          marginTop: 16,
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          opacity: canContinue ? 1 : 0.4,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '700' }}>Weiter</Text>
      </Pressable>
    </View>
  );
}

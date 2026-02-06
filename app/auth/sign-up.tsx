import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'azubi' | 'betrieb' }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignUp = async () => {
    if (!role) return Alert.alert('Fehler', 'Rolle fehlt. Bitte zurück.');
    if (!email || !password) return Alert.alert('Fehler', 'Email und Passwort sind Pflicht.');

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return Alert.alert('Signup fehlgeschlagen', error.message);

    const userId = data.user?.id;
    if (!userId) return Alert.alert('Fehler', 'Kein UserId erhalten.');

    // Create profiles row (role)
    const { error: pErr } = await supabase.from('profiles').insert({ user_id: userId, role });

    if (pErr) return Alert.alert('Fehler', `profiles insert: ${pErr.message}`);

    router.replace({ pathname: '/legal/consent', params: { role } });
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Registrierung ({role})</Text>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        placeholder="Passwort"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <Pressable onPress={onSignUp} style={{ padding: 14, borderWidth: 1, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: '700' }}>Account erstellen</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/auth/sign-in')} style={{ padding: 12 }}>
        <Text style={{ textDecorationLine: 'underline' }}>Ich habe schon einen Account</Text>
      </Pressable>
    </View>
  );
}

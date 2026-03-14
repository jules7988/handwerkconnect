import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Alert.alert('Login fehlgeschlagen', error.message);
    }

    const userId = data.user?.id;
    if (!userId) {
      return Alert.alert('Fehler', 'Keine User-ID erhalten.');
    }

    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (pErr) {
      return Alert.alert('Fehler', `profiles read: ${pErr.message}`);
    }

    if (!prof?.role) {
      return Alert.alert('Fehler', 'Keine Rolle im Profil gefunden.');
    }

    router.replace(prof.role === 'azubi' ? '/azubi/profile' : '/company/profile');
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Login</Text>

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

      <Pressable
        onPress={onSignIn}
        style={{ padding: 14, borderWidth: 1, borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={{ fontWeight: '700' }}>Einloggen</Text>
      </Pressable>
    </View>
  );
}
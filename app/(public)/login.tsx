import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Keine User-ID erhalten.');

      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (pErr) throw new Error(`profiles read: ${pErr.message}`);
      if (!prof?.role) throw new Error('Keine Rolle im Profil gefunden.');

      if (prof.role === 'azubi') {
        router.replace('/azubi/profile');
      } else if (prof.role === 'betrieb') {
        router.replace('/company/profile');
      } else {
        throw new Error(`Unbekannte Rolle: ${prof.role}`);
      }

    } catch (e: any) {
      Alert.alert('Login fehlgeschlagen', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Einloggen</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholder="E-Mail"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        value={pw}
        onChangeText={setPw}
        placeholder="Passwort"
        secureTextEntry
        style={styles.input}
      />

      <View style={{ height: 12 }} />

      <Button
        title="Los geht's"
        onPress={onLogin}
        loading={loading}
      />

      <View style={{ height: 16 }} />

      <BackToWelcomeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
});
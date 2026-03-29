import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === 'azubi' ? 'azubi' : 'betrieb';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Kein User zurückbekommen (signUp)');

      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, role });

      if (upsertErr) throw upsertErr;

      router.replace('/');
    } catch (e: any) {
      Alert.alert('Signup fehlgeschlagen', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Konto erstellen</Text>
      <Text style={styles.subtitle}>
        Rolle: {role === 'azubi' ? 'Azubi' : 'Betrieb'}
      </Text>

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
        title="Konto erstellen"
        onPress={onSignup}
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
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import LegalLinks from '@/components/LegalLinks';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('E-Mail fehlt', 'Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    if (!pw) {
      Alert.alert('Passwort fehlt', 'Bitte gib dein Passwort ein.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: pw,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Keine User-ID erhalten.');

      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (pErr) throw new Error(`profiles read: ${pErr.message}`);

      if (!prof?.role) {
        router.replace('/(public)/welcome');
        return;
      }

      if (prof.role === 'azubi') {
        router.replace('/azubi/profile');
        return;
      }

      if (prof.role === 'betrieb') {
        router.replace('/company/profile');
        return;
      }

      throw new Error(`Unbekannte Rolle: ${prof.role}`);
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
        autoCorrect={false}
        placeholder="E-Mail"
        keyboardType="email-address"
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        value={pw}
        onChangeText={setPw}
        placeholder="Passwort"
        secureTextEntry
        style={styles.input}
        editable={!loading}
      />

      <View style={{ height: 12 }} />

      <Button
        title="Los geht's"
        onPress={onLogin}
        loading={loading}
      />

      <Pressable
        onPress={() => router.push('/(public)/forgot-password')}
        style={styles.forgotButton}
        disabled={loading}
      >
        <Text style={styles.forgotText}>Passwort vergessen?</Text>
      </Pressable>

      <View style={{ height: 8 }} />

      <BackToWelcomeButton />

      <LegalLinks />
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
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});
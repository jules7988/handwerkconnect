import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PRIVACY_VERSION } from '@/lib/legal';

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === 'azubi' ? 'azubi' : 'betrieb';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('E-Mail fehlt', 'Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    if (!pw) {
      Alert.alert('Passwort fehlt', 'Bitte gib ein Passwort ein.');
      return;
    }

    if (!privacyAccepted) {
      Alert.alert(
        'Datenschutzerklärung',
        'Bitte stimmen Sie zuerst der Datenschutzerklärung zu.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: pw,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Kein User zurückbekommen (signUp)');

      const { error: upsertErr } = await supabase.from('profiles').upsert({
        user_id: userId,
        role,
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: PRIVACY_VERSION,
      });

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

      <Pressable
        onPress={() => setPrivacyAccepted((value) => !value)}
        style={styles.checkboxRow}
        disabled={loading}
      >
        <Text style={styles.checkbox}>{privacyAccepted ? '☑︎' : '☐'}</Text>

        <Text style={styles.checkboxText}>
          Ich habe die{' '}
          <Text
            style={styles.privacyLink}
            onPress={() => router.push('/legal/datenschutz' as any)}
          >
            Datenschutzerklärung
          </Text>{' '}
          gelesen und akzeptiere diese.
        </Text>
      </Pressable>

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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    fontSize: 22,
    lineHeight: 24,
  },
  checkboxText: {
    flex: 1,
    color: '#374151',
    lineHeight: 20,
  },
  privacyLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
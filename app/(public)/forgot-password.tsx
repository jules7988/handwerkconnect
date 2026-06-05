import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const onSendResetLink = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('E-Mail fehlt', 'Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('E-Mail ungültig', 'Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'handwerkconnect:///reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Link gesendet',
        'Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen gesendet.'
      );
    } catch {
      Alert.alert(
        'Fehler',
        'Der Link konnte gerade nicht gesendet werden. Bitte versuche es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passwort zurücksetzen</Text>

      <Text style={styles.description}>
        Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
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

      <View style={{ height: 12 }} />

      <Button title="Reset-Link senden" onPress={onSendResetLink} loading={loading} />

      <Pressable
        onPress={() => router.replace('/(public)/login')}
        style={styles.backButton}
        disabled={loading}
      >
        <Text style={styles.backText}>Zurück zum Login</Text>
      </Pressable>
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
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
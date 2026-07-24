import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';

import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import LegalLinks from '@/components/LegalLinks';
import { supabase } from '@/lib/supabase';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLoginErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials')
  ) {
    return 'E-Mail-Adresse oder Passwort sind nicht korrekt.';
  }

  if (
    message.includes('email not confirmed') ||
    message.includes('email address not confirmed')
  ) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Bestätigungsmail.';
  }

  if (
    message.includes('invalid email') ||
    message.includes('invalid format')
  ) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return 'Die Verbindung zum Server ist fehlgeschlagen. Bitte prüfe deine Internetverbindung.';
  }

  if (message.includes('keine user-id erhalten')) {
    return 'Der Login konnte nicht vollständig abgeschlossen werden. Bitte versuche es erneut.';
  }

  if (message.includes('profiles read')) {
    return 'Dein Profil konnte nicht geladen werden. Bitte versuche es erneut.';
  }

  if (message.includes('unbekannte rolle')) {
    return 'Für dein Konto ist keine gültige Benutzerrolle hinterlegt.';
  }

  return 'Der Login ist fehlgeschlagen. Bitte versuche es erneut.';
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert('E-Mail fehlt', 'Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert(
        'Ungültige E-Mail-Adresse',
        'Bitte gib eine gültige E-Mail-Adresse ein.'
      );
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

      if (error) {
        throw error;
      }

      const userId = data.user?.id;

      if (!userId) {
        throw new Error('Keine User-ID erhalten.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Profiles read: ${profileError.message}`);
      }

      if (!profile?.role) {
        router.replace('/(public)/welcome');
        return;
      }

      if (profile.role === 'azubi') {
        router.replace('/azubi/profile');
        return;
      }

      if (profile.role === 'betrieb') {
        router.replace('/company/profile');
        return;
      }

      throw new Error(`Unbekannte Rolle: ${profile.role}`);
    } catch (error: unknown) {
      Alert.alert('Login fehlgeschlagen', getLoginErrorMessage(error));
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
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="E-Mail"
        keyboardType="email-address"
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        value={pw}
        onChangeText={setPw}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        placeholder="Passwort"
        secureTextEntry
        style={styles.input}
        editable={!loading}
      />

      <View style={styles.smallSpacer} />

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

      <View style={styles.tinySpacer} />

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
  smallSpacer: {
    height: 12,
  },
  tinySpacer: {
    height: 8,
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
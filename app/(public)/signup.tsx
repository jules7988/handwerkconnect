import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Button from '@/components/Button';
import BackToWelcomeButton from '@/components/BackToWelcomeButton';
import { supabase } from '@/lib/supabase';
import { PRIVACY_VERSION } from '@/lib/legal';

type SignupRole = 'azubi' | 'betrieb';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSignupErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (
    message.includes('invalid email') ||
    message.includes('invalid format') ||
    message.includes('unable to validate email')
  ) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }

  if (
    message.includes('password should be at least') ||
    message.includes('password must be at least')
  ) {
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  }

  if (
    message.includes('user already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists')
  ) {
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto.';
  }

  if (
    message.includes('email rate limit') ||
    message.includes('rate limit')
  ) {
    return 'Es wurden zu viele Anfragen gesendet. Bitte versuche es später erneut.';
  }

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return 'Die Verbindung zum Server ist fehlgeschlagen. Bitte prüfe deine Internetverbindung.';
  }

  return 'Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut.';
}

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const role: SignupRole | null =
    params.role === 'azubi' || params.role === 'betrieb'
      ? params.role
      : null;

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!role) {
      Alert.alert(
        'Rolle fehlt',
        'Bitte gehe zurück und wähle aus, ob du einen Ausbildungsplatz oder Azubis suchst.'
      );
      return;
    }

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
      Alert.alert('Passwort fehlt', 'Bitte gib ein Passwort ein.');
      return;
    }

    if (pw.length < 6) {
      Alert.alert(
        'Passwort zu kurz',
        'Das Passwort muss mindestens 6 Zeichen lang sein.'
      );
      return;
    }

    if (!privacyAccepted) {
      Alert.alert(
        'Datenschutzerklärung',
        'Bitte stimme zuerst der Datenschutzerklärung zu.'
      );
      return;
    }

    try {
      setLoading(true);

      const privacyAcceptedAt = new Date().toISOString();

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: pw,
        options: {
          emailRedirectTo: 'handwerkconnect://login',
          data: {
            role,
            privacy_accepted_at: privacyAcceptedAt,
            privacy_version: PRIVACY_VERSION,
          },
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Konto erstellt',
        'Wir haben dir eine Bestätigungsmail gesendet. Bitte bestätige zuerst deine E-Mail-Adresse und logge dich anschließend ein.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(public)/login'),
          },
        ]
      );
    } catch (error: unknown) {
      Alert.alert(
        'Registrierung fehlgeschlagen',
        getSignupErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Konto erstellen</Text>

      <Text style={styles.subtitle}>
        Rolle:{' '}
        {role === 'azubi'
          ? 'Azubi'
          : role === 'betrieb'
            ? 'Betrieb'
            : 'Nicht ausgewählt'}
      </Text>

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
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="Passwort"
        secureTextEntry
        style={styles.input}
        editable={!loading}
      />

      <Pressable
        onPress={() => setPrivacyAccepted((currentValue) => !currentValue)}
        style={styles.checkboxRow}
        disabled={loading}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: privacyAccepted }}
      >
        <Text style={styles.checkbox}>
          {privacyAccepted ? '☑︎' : '☐'}
        </Text>

        <Text style={styles.checkboxText}>
          Ich habe die{' '}
          <Text
            style={styles.privacyLink}
            onPress={() => router.push('/legal/datenschutz' as never)}
          >
            Datenschutzerklärung
          </Text>{' '}
          gelesen und akzeptiere diese.
        </Text>
      </Pressable>

      <View style={styles.smallSpacer} />

      <Button
        title="Konto erstellen"
        onPress={onSignup}
        loading={loading}
      />

      <View style={styles.mediumSpacer} />

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
  smallSpacer: {
    height: 12,
  },
  mediumSpacer: {
    height: 16,
  },
});
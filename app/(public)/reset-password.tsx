import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';

type RecoveryState = 'loading' | 'ready' | 'invalid';

export default function ResetPassword() {
  const router = useRouter();

  const [state, setState] = useState<RecoveryState>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handledUrlRef = useRef<string | null>(null);

  const getParam = (url: string, key: string) => {
    const normalizedUrl = url.replace('#', '?');
    const parsedUrl = new URL(normalizedUrl);
    return parsedUrl.searchParams.get(key);
  };

  const establishRecoverySession = async (url: string | null) => {
    try {
      setState('loading');

      if (!url) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setState('ready');
          return;
        }

        throw new Error('Keine Recovery URL gefunden.');
      }

      if (handledUrlRef.current === url) return;
      handledUrlRef.current = url;

      const code = getParam(url, 'code');
      const accessToken = getParam(url, 'access_token');
      const refreshToken = getParam(url, 'refresh_token');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
      } else {
        throw new Error('Recovery Parameter fehlen.');
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('Keine gültige Recovery Session.');

      setState('ready');
    } catch {
      await supabase.auth.signOut();
      setState('invalid');
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (!active) return;
      await establishRecoverySession(initialUrl);
    };

    init();

    const subscription = Linking.addEventListener('url', async (event) => {
      await establishRecoverySession(event.url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const onSavePassword = async () => {
    if (saving) return;

    if (newPassword.length < 8) {
      Alert.alert('Passwort zu kurz', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (newPassword !== repeatPassword) {
      Alert.alert('Passwörter stimmen nicht überein', 'Bitte gib zweimal dasselbe Passwort ein.');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await supabase.auth.signOut();

      Alert.alert(
        'Passwort geändert',
        'Dein Passwort wurde geändert. Du kannst dich jetzt einloggen.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(public)/login'),
          },
        ]
      );
    } catch {
      await supabase.auth.signOut();

      Alert.alert(
        'Fehler',
        'Dein Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.'
      );

      setState('invalid');
    } finally {
      setSaving(false);
    }
  };

  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <Text style={styles.description}>Link wird geprüft...</Text>
      </View>
    );
  }

  if (state === 'invalid') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Link ungültig</Text>

        <Text style={styles.description}>
          Der Link ist abgelaufen oder ungültig. Bitte fordere einen neuen Link an.
        </Text>

        <Button
          title="Neuen Link anfordern"
          onPress={() => router.replace('/(public)/forgot-password')}
        />

        <Pressable
          onPress={() => router.replace('/(public)/login')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Zurück zum Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neues Passwort vergeben</Text>

      <Text style={styles.description}>
        Gib dein neues Passwort ein. Es muss mindestens 8 Zeichen lang sein.
      </Text>

      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Neues Passwort"
        secureTextEntry
        style={styles.input}
        editable={!saving}
      />

      <TextInput
        value={repeatPassword}
        onChangeText={setRepeatPassword}
        placeholder="Passwort wiederholen"
        secureTextEntry
        style={styles.input}
        editable={!saving}
      />

      <View style={{ height: 12 }} />

      <Button
        title="Passwort speichern"
        onPress={onSavePassword}
        loading={saving}
      />

      <Pressable
        onPress={() => router.replace('/(public)/login')}
        style={styles.backButton}
        disabled={saving}
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
    color: '#2563eb',
  },
});
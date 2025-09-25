import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const r = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('azubi@handwerkconnect.dev');
  const [pw, setPw] = useState('Azubi!123');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await login(email, pw);
      r.replace('/(tabs)/feed');
    } catch (e: any) {
      Alert.alert('Login fehlgeschlagen', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Einloggen</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none"
                 placeholder="E-Mail" keyboardType="email-address" style={styles.input}/>
      <TextInput value={pw} onChangeText={setPw} placeholder="Passwort"
                 secureTextEntry style={styles.input}/>
      <View style={{ height: 12 }} />
      <Button title="Los geht's" onPress={onLogin} loading={loading} />
      <Text style={styles.hint}>Test-Login: azubi@handwerkconnect.dev / Azubi!123</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12 },
  hint: { marginTop: 8, color: '#6b7280' },
});

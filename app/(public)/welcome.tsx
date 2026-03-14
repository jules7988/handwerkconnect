import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen bei HandwerkConnect</Text>
      <Text style={styles.subtitle}>Azubi oder Betrieb? Wähle deinen Einstieg.</Text>

      <View style={styles.actions}>
        <Button
          title="Ich bin Azubi"
          onPress={() => router.push('/(public)/signup?role=azubi')}
        />
        <View style={{ height: 12 }} />
        <Button
          title="Ich bin Betrieb"
          onPress={() => router.push('/(public)/signup?role=betrieb')}
        />

        <View style={{ height: 24 }} />

        <Button
          title="Ich habe schon ein Konto (Login)"
          onPress={() => router.push('/(public)/login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#6b7280', textAlign: 'center' },
  actions: { width: '100%', marginTop: 24 },
});
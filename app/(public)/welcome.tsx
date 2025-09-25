import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen bei HandwerkConnect</Text>
      <Text style={styles.subtitle}>Swipe & Match für Azubis und Handwerksbetriebe.</Text>
      <View style={styles.actions}>
        <Button title="Einloggen" onPress={() => router.push('/(public)/login')} />
        <View style={{ height: 12 }} />
        <Button title="Konto erstellen" onPress={() => router.push('/(public)/signup')} />
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
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import Button from '@/components/Button';
import LegalLinks from '@/components/LegalLinks';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen bei AzuConnect</Text>

      <Text style={styles.subtitle}>
        Suchst du einen Ausbildungsplatz oder bist du ein Betrieb und suchst
        Auszubildende?
      </Text>

      <View style={styles.actions}>
        <Button
          title="Neu als Azubi registrieren"
          onPress={() => router.push('/(public)/signup?role=azubi')}
        />

        <View style={styles.smallSpacer} />

        <Button
          title="Neu als Betrieb registrieren"
          onPress={() => router.push('/(public)/signup?role=betrieb')}
        />

        <View style={styles.largeSpacer} />

        <Button
          title="Ich habe schon ein Konto (Login)"
          onPress={() => router.push('/(public)/login')}
        />

        <LegalLinks />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 24,
  },
  smallSpacer: {
    height: 12,
  },
  largeSpacer: {
    height: 24,
  },
});
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function LegalLinks() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/legal/impressum' as any)}>
        <Text style={styles.link}>Impressum</Text>
      </Pressable>

      <Text style={styles.separator}>·</Text>

      <Pressable onPress={() => router.push('/legal/datenschutz' as any)}>
        <Text style={styles.link}>Datenschutz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    color: '#2563eb',
    fontWeight: '600',
  },
  separator: {
    color: '#6b7280',
  },
});
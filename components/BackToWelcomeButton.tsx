import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';

export default function BackToWelcomeButton() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button
        title="← Zurück"
        onPress={() => router.replace('/(public)/welcome')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
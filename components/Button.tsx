import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

type Props = { title: string; onPress?: () => void; disabled?: boolean; loading?: boolean; };
export default function Button({ title, onPress, disabled, loading }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.6 },
});

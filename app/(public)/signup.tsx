import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function Login(){ 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login (Stub)</Text>
      <Text style={styles.subtitle}>Hier kommt später der Login-Flow.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { color: '#6b7280', marginTop: 6 },
});
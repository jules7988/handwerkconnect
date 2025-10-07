import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { mockAzubis } from '../data/mock';

export default function AnalyticsScreen() {
  const totalAzubis = mockAzubis.length;
  const byBeruf = Array.from(new Set(mockAzubis.map(a => a.beruf)));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Analyse</Text>
      <Text style={styles.item}>Gesamt Azubis: {totalAzubis}</Text>
      <Text style={styles.item}>Ausbildungsplätze: {byBeruf.join(', ')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { fontSize: 28, color: '#00c853', marginBottom: 10 },
  item: { color: '#fff', fontSize: 18, marginVertical: 5 }
});

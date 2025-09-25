import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { title: string; city?: string; occupation?: string; bio?: string; avatar?: string | null; };

export default function Card({ title, city, occupation, bio }: Props) {
  return (
    <View style={styles.card}>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.circle} />
        <Text style={styles.name}>{title}</Text>
        {occupation ? <Text style={styles.occ}>{occupation}</Text> : null}
        {city ? <Text style={styles.city}>{city}</Text> : null}
      </View>
      <Text style={styles.bio} numberOfLines={3}>{bio ?? 'Keine Beschreibung'}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, width: 320, height: 420,
          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3, justifyContent: 'space-between' },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700' },
  occ: { marginTop: 4, color: '#374151' },
  city: { color: '#6b7280' },
  bio: { textAlign: 'center', color: '#374151' },
});

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFeed } from '@/lib/api';
import Swiper from 'react-native-deck-swiper';
import Card from '@/components/Card';

export default function Feed() {
  const { data } = useQuery({ queryKey: ['feed'], queryFn: () => getFeed('apprentice') });
  const items = data?.data ?? [];
  const ref = useRef<Swiper<any>>(null);

  if (!items.length) {
    return (
      <View style={[styles.container, { padding: 24 }]}>
        <Text style={styles.title}>Keine Vorschläge</Text>
        <Text style={styles.sub}>Später nochmal versuchen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        ref={ref}
        cards={items}
        renderCard={(c: any) => (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Card title={c.title} city={c.city} occupation={c.occupation} bio={c.bio} />
          </View>
        )}
        backgroundColor="transparent"
        cardIndex={0}
        stackSize={2}
        stackSeparation={12}
        onSwipedRight={(i) => Alert.alert('Like', `Du hast ${items[i].title} geliked 👍`)}
        onSwipedLeft={(i) => Alert.alert('Übersprungen', `${items[i].title} wurde übersprungen`)}
        onSwipedAll={() => Alert.alert('Ende', 'Keine weiteren Firmen')}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { color: '#6b7280', marginTop: 6 },
});

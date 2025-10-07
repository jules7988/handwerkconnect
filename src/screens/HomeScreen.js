import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';
import ItsAMatchModal from '../components/ItsAMatchModal';

export default function HomeScreen() {
  const { currentUser, azubis, firmen, createMatch } = useApp();
  const [index, setIndex] = useState(0);
  const [matchVisible, setMatchVisible] = useState(false);
  const candidates = currentUser.role === 'firma' ? azubis : firmen;
  const candidate = candidates[index % candidates.length];

  const like = () => {
    if (currentUser.role === 'firma') createMatch(candidate.id, currentUser.id);
    else createMatch(currentUser.id, candidate.id);
    setMatchVisible(true);
    setIndex(i => i + 1);
  };
  const skip = () => setIndex(i => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: candidate.avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={styles.meta}>
          {'alter' in candidate ? `${candidate.alter} • ${candidate.ort}` : `${candidate.branche} • ${candidate.ort}`}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={skip}><Text style={styles.btnText}>Nope</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#22c55e' }]} onPress={like}><Text style={styles.btnText}>Like</Text></TouchableOpacity>
      </View>
      <ItsAMatchModal
        visible={matchVisible}
        onClose={() => setMatchVisible(false)}
        names={{ azubi: currentUser.role === 'firma' ? candidate.name : currentUser.name, firma: currentUser.role === 'firma' ? currentUser.name : candidate.name }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f14', padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#121821', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  avatar: { width: 180, height: 180, borderRadius: 12, marginBottom: 12 },
  name: { color: '#e6edf3', fontSize: 22, fontWeight: '800' },
  meta: { color: '#9ca3af', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnText: { color: '#0b0f14', fontWeight: '800' },
});

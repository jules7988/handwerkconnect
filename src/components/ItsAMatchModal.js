import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';

export default function ItsAMatchModal({ visible, onClose, names }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>It’s a match</Text>
          <Text style={styles.subtitle}>{names.azubi} ❤ {names.firma}</Text>
          <Text style={styles.hint}>Ihr könnt jetzt chatten!</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#0f172a', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#16a34a' },
  title: { fontSize: 64, color: '#22c55e', fontWeight: '900', textAlign: 'center', marginBottom: 8, textShadowColor: '#16a34a', textShadowRadius: 12 },
  subtitle: { fontSize: 18, color: '#e6edf3', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});

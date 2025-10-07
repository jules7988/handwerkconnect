import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
export default function ItsAMatchModal({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Text style={styles.text}>It's a Match! 💚</Text>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 42, color: '#00c853', fontWeight: 'bold' }
});

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const mockChats = [
  { id: '1', name: 'Lukas Müller', lastMessage: 'Bis morgen!', timestamp: '2025-10-07 13:45' },
  { id: '2', name: 'Sophie Klein', lastMessage: 'Freue mich auf das Gespräch!', timestamp: '2025-10-07 12:10' },
  { id: '3', name: 'BauPro GmbH', lastMessage: 'Wir melden uns nächste Woche.', timestamp: '2025-10-07 09:00' }
];

export default function ChatsListScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockChats.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { chat: item })}>
            <View style={styles.chatItem}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message}>{item.lastMessage}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  chatItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  name: { color: '#00c853', fontWeight: 'bold', fontSize: 18 },
  message: { color: '#fff', marginTop: 4 }
});

import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useApp } from '../state/AppContext';

export default function ChatsListScreen({ navigation }: any) {
  const { messages, azubis, firmen, currentUser, matches } = useApp();

  const chats = useMemo(() => {
    const allowed = new Set(matches.map((m:any) => `${m.azubiId}_${m.firmaId}`));
    const map = new Map<string, { lastMessageAt: number; lastText: string; azubiId: string; firmaId: string }>();
    messages.forEach((m:any) => {
      if (!allowed.has(m.chatId)) return;
      const [aId, fId] = m.chatId.split('_');
      const key = `${aId}_${fId}`;
      const prev = map.get(key);
      const lastMessageAt = prev ? Math.max(prev.lastMessageAt, m.createdAt) : m.createdAt;
      map.set(key, { lastMessageAt, lastText: m.text, azubiId: aId, firmaId: fId });
    });
    return Array.from(map.values()).sort((a,b)=> b.lastMessageAt - a.lastMessageAt);
  }, [messages, matches]);

  const getPeer = (aId: string, fId: string) => currentUser.role === 'firma' ? azubis.find((a:any)=>a.id===aId) : firmen.find((f:any)=>f.id===fId);

  return (
    <View style={{ flex:1, backgroundColor:'#0b0f14', padding:12 }}>
      <FlatList
        data={chats}
        keyExtractor={item => `${item.azubiId}_${item.firmaId}`}
        renderItem={({ item }) => {
          const peer:any = getPeer(item.azubiId, item.firmaId);
          return (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Chat', { chatId: `${item.azubiId}_${item.firmaId}` })}>
              <Image source={{ uri: peer?.avatarUrl }} style={styles.avatar} />
              <View style={{ flex:1 }}>
                <Text style={styles.name}>{peer?.name}</Text>
                <Text style={styles.preview} numberOfLines={1}>{item.lastText}</Text>
              </View>
              <Text style={styles.time}>{new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', paddingVertical:12, gap:12, borderBottomWidth:1, borderBottomColor:'#1f2937' },
  avatar: { width:48, height:48, borderRadius:10 },
  name: { color:'#e6edf3', fontWeight:'700', marginBottom:2 },
  preview: { color:'#9ca3af' },
  time: { color:'#64748b', fontSize:12 }
});

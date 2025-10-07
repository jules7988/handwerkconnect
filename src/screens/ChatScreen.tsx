import React, { useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';

export default function ChatScreen({ route }: any) {
  const { chatId } = route.params as { chatId: string };
  const { messages, sendMessage, currentUser } = useApp();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const data = useMemo(() => messages.filter((m:any)=> m.chatId===chatId).sort((a:any,b:any)=> a.createdAt - b.createdAt), [messages, chatId]);

  const onSend = () => {
    if (!text.trim()) return;
    sendMessage(chatId, (currentUser as any).id, text.trim());
    setText('');
    setTimeout(()=> listRef.current?.scrollToEnd({ animated:true }), 50);
  };

  return (
    <View style={{ flex:1, backgroundColor:'#0b0f14' }}>
      <FlatList
        ref={listRef}
        contentContainerStyle={{ padding:12 }}
        data={data}
        keyExtractor={(item:any) => item.id}
        renderItem={({ item }: any) => {
          const mine = item.senderId === (currentUser as any).id;
          return (
            <View style={[styles.row, mine ? styles.right : styles.left]}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.text, !mine && styles.textTheirs]}>{item.text}</Text>
                <Text style={[styles.timestamp, !mine && styles.timestampTheirs]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nachricht schreiben…"
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend}><Text style={{ color:'#0b0f14', fontWeight:'800' }}>Senden</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom:6, flexDirection:'row' },
  left: { justifyContent:'flex-start' },
  right: { justifyContent:'flex-end' },
  bubble: { maxWidth:'78%', padding:10, borderRadius:16, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:4, shadowOffset:{ width:0, height:2 } },
  mine: { backgroundColor:'#22c55e', borderTopRightRadius:4 },
  theirs: { backgroundColor:'#1f2937', borderTopLeftRadius:4 },
  text: { color:'#0b0f14' },
  textTheirs: { color:'#e6edf3' },
  timestamp: { fontSize:10, opacity:0.7, marginTop:4, alignSelf:'flex-end', color:'#0b0f14' },
  timestampTheirs: { color:'#cbd5e1' },
  inputRow: { flexDirection:'row', alignItems:'center', gap:8, padding:8, borderTopWidth:1, borderTopColor:'#1f2937' },
  input: { flex:1, backgroundColor:'#121821', color:'#e6edf3', padding:12, borderRadius:12 },
  sendBtn: { backgroundColor:'#22c55e', paddingVertical:10, paddingHorizontal:14, borderRadius:12 },
});

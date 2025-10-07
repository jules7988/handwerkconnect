import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useApp } from '../state/AppContext';
import { haversineKm } from '../utils/geo';

const places = ['Zimmermann','Schweißer','KFZ-Mechatroniker','Elektriker','Sanitär-Heizung-Klima','Maler','Dachdecker'];

export default function AnalyticsScreen() {
  const { azubis, currentUser } = useApp();
  const [platz, setPlatz] = useState('alle');
  const [radiusKm, setRadiusKm] = useState('10');
  const [alterVon, setAlterVon] = useState('16');
  const [alterBis, setAlterBis] = useState('25');
  const [abschluss, setAbschluss] = useState('alle');

  const center = currentUser.role === 'firma' ? { lat: (currentUser as any).lat, lon: (currentUser as any).lon } : { lat: 48.7758, lon: 9.1829 };

  const filtered = useMemo(() => azubis.filter((a:any) => {
    const byPlatz = platz === 'alle' || a.sucht.includes(platz);
    const byRadius = haversineKm(center.lat, center.lon, a.lat, a.lon) <= Number(radiusKm || '0');
    const byAlter = a.alter >= Number(alterVon || '0') && a.alter <= Number(alterBis || '200');
    const byAbschluss = abschluss === 'alle' || a.schulabschluss === abschluss;
    return byPlatz && byRadius && byAlter && byAbschluss;
  }), [azubis, platz, radiusKm, alterVon, alterBis, abschluss]);

  const total = azubis.length;
  const totalFiltered = filtered.length;
  const byPlaceCount:any = Object.fromEntries(places.map(p => [p, azubis.filter((a:any)=>a.sucht.includes(p)).length]));

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Analyse</Text>

      <View style={styles.filters}>
        <View style={styles.row}>
          <Text style={styles.label}>Ausbildungsplatz</Text>
          <TextInput style={styles.input} value={platz === 'alle' ? '' : platz} onChangeText={(v)=> setPlatz((places as any).includes(v) ? v : 'alle')} placeholder="alle oder z.B. Elektriker" placeholderTextColor="#64748b" autoCapitalize="none" />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Radius (km)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={radiusKm} onChangeText={setRadiusKm} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Alter von/bis</Text>
          <View style={{ flexDirection:'row', gap:8, flex:1 }}>
            <TextInput style={[styles.input,{flex:1}]} keyboardType="numeric" value={alterVon} onChangeText={setAlterVon} />
            <TextInput style={[styles.input,{flex:1}]} keyboardType="numeric" value={alterBis} onChangeText={setAlterBis} />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Schulabschluss</Text>
          <TextInput style={styles.input} value={abschluss === 'alle' ? '' : abschluss} onChangeText={(v)=> setAbschluss((['Hauptschule','Realschule','Fachabi','Abi','sonstiges'] as any).includes(v) ? v : 'alle')} placeholder="alle oder z.B. Realschule" placeholderTextColor="#64748b" autoCapitalize="none" />
        </View>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}><Text style={styles.kpiLabel}>Azubis gesamt</Text><Text style={styles.kpiValue}>{total}</Text></View>
        <View style={styles.card}><Text style={styles.kpiLabel}>Azubis im Filter</Text><Text style={styles.kpiValue}>{totalFiltered}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Verteilung Ausbildungsplätze (gesamt)</Text>
        {places.map(p => (
          <View key={p} style={styles.barRow}>
            <Text style={styles.barLabel}>{p}</Text>
            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(byPlaceCount[p] / Math.max(total,1)) * 100}%` }]} /></View>
            <Text style={styles.barCount}>{byPlaceCount[p]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f14', padding:12 },
  h1:{ color:'#e6edf3', fontSize:22, fontWeight:'800', marginBottom:12 },
  h2:{ color:'#e6edf3', fontSize:16, fontWeight:'700', marginBottom:8, marginTop:12 },
  filters:{ backgroundColor:'#121821', padding:12, borderRadius:12, borderWidth:1, borderColor:'#1f2937' },
  row:{ flexDirection:'row', alignItems:'center', marginBottom:8 },
  label:{ color:'#9ca3af', width:140 },
  input:{ flex:1, backgroundColor:'#0b0f14', color:'#e6edf3', borderRadius:8, paddingHorizontal:10, paddingVertical:Platform.OS==='ios'?10:6, borderWidth:1, borderColor:'#1f2937' },
  cards:{ flexDirection:'row', gap:8, marginTop:12 },
  card:{ flex:1, backgroundColor:'#121821', borderRadius:12, padding:12, borderWidth:1, borderColor:'#1f2937' },
  kpiLabel:{ color:'#9ca3af', marginBottom:6 },
  kpiValue:{ color:'#22c55e', fontSize:20, fontWeight:'900' },
  section:{ marginTop:8 },
  barRow:{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  barLabel:{ color:'#e6edf3', width:170 },
  barTrack:{ flex:1, height:8, backgroundColor:'#1f2937', borderRadius:6 },
  barFill:{ height:8, backgroundColor:'#22c55e', borderRadius:6 },
  barCount:{ color:'#9ca3af', width:32, textAlign:'right' },
});

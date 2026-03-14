import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from "@/lib/supabase";

type Trade = { id: string; name: string };

export default function AzubiProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [plz, setPlz] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  const isValid = useMemo(() => {
    const hasContact =
      (email?.trim()?.length ?? 0) > 3 ||
      (whatsappLink?.trim()?.length ?? 0) > 10;

    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      street.trim().length > 0 &&
      houseNo.trim().length > 0 &&
      plz.trim().length >= 5 &&
      city.trim().length > 0 &&
      !!selectedTradeId &&
      hasContact
    );
  }, [
    firstName,
    lastName,
    street,
    houseNo,
    plz,
    city,
    selectedTradeId,
    email,
    whatsappLink,
  ]);

  const load = async () => {
    setLoading(true);

    const { data: sessionData, error: sErr } =
      await supabase.auth.getSession();

    if (sErr) {
      setLoading(false);
      return Alert.alert('Fehler', sErr.message);
    }

    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setLoading(false);
      return Alert.alert('Nicht eingeloggt', 'Bitte erneut einloggen.');
    }

    // Trades laden
    const { data: tData, error: tErr } = await supabase
      .from('trades')
      .select('id,name')
      .eq('active', true)
      .order('name', { ascending: true });

    if (tErr) {
      setLoading(false);
      return Alert.alert('Fehler', `Trades laden: ${tErr.message}`);
    }

    setTrades(tData ?? []);

    // Azubi-Profil laden
    const { data: aData, error: aErr } = await supabase
      .from('azubi_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (aErr) {
      setLoading(false);
      return Alert.alert('Fehler', `Profil laden: ${aErr.message}`);
    }

    if (aData) {
      setFirstName(aData.first_name ?? '');
      setLastName(aData.last_name ?? '');
      setStreet(aData.street ?? '');
      setHouseNo(aData.house_no ?? '');
      setPlz(aData.plz ?? '');
      setCity(aData.city ?? '');
      setSelectedTradeId(aData.trade_id ?? null);
      setEmail(aData.email ?? '');
      setWhatsappLink(aData.whatsapp_link ?? '');
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    if (!isValid) {
      return Alert.alert(
        'Fehler',
        'Bitte alle Pflichtfelder ausfüllen (Kontakt: E-Mail oder WhatsApp-Link).'
      );
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setSaving(false);
      return Alert.alert('Nicht eingeloggt', 'Bitte erneut einloggen.');
    }

    const now = new Date().toISOString();

    const { error } = await supabase.from('azubi_profiles').upsert(
      {
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        street: street.trim(),
        house_no: houseNo.trim(),
        plz: plz.trim(),
        city: city.trim(),
        trade_id: selectedTradeId,
        email: email.trim() || null,
        whatsapp_link: whatsappLink.trim() || null,
        consent_terms: true,
        consent_terms_at: now,
        consent_privacy: true,
        consent_privacy_at: now,
      },
      { onConflict: 'user_id' }
    );

    setSaving(false);

    if (error) return Alert.alert('Fehler', `Speichern: ${error.message}`);

    Alert.alert('Gespeichert', 'Dein Profil wurde gespeichert.', [
      {
        text: 'Betriebe ansehen',
        onPress: () => router.replace('/azubi/companies'),
      },
      { text: 'OK' },
    ]);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text>Lade...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Azubi Profil</Text>

      {/* Quick Action */}
      <Pressable
        onPress={() => router.push('/azubi/companies')}
        style={{
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: 'center',
          opacity: selectedTradeId ? 1 : 0.6,
        }}
      >
        <Text style={{ fontWeight: '700' }}>Betriebe ansehen</Text>
        {!selectedTradeId && (
          <Text style={{ marginTop: 4, color: '#6b7280' }}>
            (Tipp: erst Beruf auswählen für passende Treffer)
          </Text>
        )}
      </Pressable>

      <TextInput
        placeholder="Vorname"
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />
      <TextInput
        placeholder="Nachname"
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        placeholder="Straße"
        value={street}
        onChangeText={setStreet}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />
      <TextInput
        placeholder="Hausnummer"
        value={houseNo}
        onChangeText={setHouseNo}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        placeholder="PLZ"
        value={plz}
        onChangeText={setPlz}
        keyboardType="number-pad"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />
      <TextInput
        placeholder="Stadt"
        value={city}
        onChangeText={setCity}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <Text style={{ fontWeight: '700', marginTop: 6 }}>Beruf</Text>
      <View style={{ gap: 8 }}>
        {trades.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setSelectedTradeId(t.id)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 10,
              opacity: selectedTradeId === t.id ? 1 : 0.7,
            }}
          >
            <Text style={{ fontWeight: selectedTradeId === t.id ? '700' : '400' }}>
              {t.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="E-Mail (optional, wenn WhatsApp-Link vorhanden)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />
      <TextInput
        placeholder="WhatsApp-Link (optional, wenn E-Mail vorhanden)"
        value={whatsappLink}
        onChangeText={setWhatsappLink}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <Pressable
        disabled={!isValid || saving}
        onPress={onSave}
        style={{
          marginTop: 10,
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: 'center',
          opacity: !isValid || saving ? 0.4 : 1,
        }}
      >
        <Text style={{ fontWeight: '700' }}>
          {saving ? 'Speichert...' : 'Speichern'}
        </Text>
      </Pressable>

      {/* Logout */}
      <Pressable
        onPress={onLogout}
        style={{
          marginTop: 30,
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '700' }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

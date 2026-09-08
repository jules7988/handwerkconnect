import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { deleteAccount } from '@/lib/deleteAccount';

type Trade = { id: string; name: string };

export default function AzubiProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const [originalAddress, setOriginalAddress] = useState({
    street: '',
    houseNo: '',
    plz: '',
    city: '',
  });

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
      const loadedStreet = aData.street ?? '';
      const loadedHouseNo = aData.house_no ?? '';
      const loadedPlz = aData.plz ?? '';
      const loadedCity = aData.city ?? '';

      setFirstName(aData.first_name ?? '');
      setLastName(aData.last_name ?? '');
      setStreet(loadedStreet);
      setHouseNo(loadedHouseNo);
      setPlz(loadedPlz);
      setCity(loadedCity);
      setSelectedTradeId(aData.trade_id ?? null);
      setEmail(aData.email ?? '');
      setWhatsappLink(aData.whatsapp_link ?? '');

      setOriginalAddress({
        street: loadedStreet,
        houseNo: loadedHouseNo,
        plz: loadedPlz,
        city: loadedCity,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const geocodeAddress = async () => {
    const { data, error } = await supabase.functions.invoke(
      'geocode-address',
      {
        body: {
          street: street.trim(),
          houseNumber: houseNo.trim(),
          postalCode: plz.trim(),
          city: city.trim(),
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const latitude = Number(data?.latitude);
    const longitude = Number(data?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('INVALID_COORDINATES');
    }

    return { latitude, longitude };
  };

  const onSave = async () => {
    if (!isValid) {
      return Alert.alert(
        'Fehler',
        'Bitte alle Pflichtfelder ausfüllen (Kontakt: E-Mail oder WhatsApp-Link).'
      );
    }

    if (deleting) {
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();

    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setSaving(false);
      return Alert.alert('Nicht eingeloggt', 'Bitte erneut einloggen.');
    }

    let coordinates: {
      latitude: number;
      longitude: number;
    };

    try {
      coordinates = await geocodeAddress();
    } catch (_error) {
      setSaving(false);

      return Alert.alert(
        'Adresse nicht gefunden',
        'Adresse konnte nicht eindeutig gefunden werden. Bitte überprüfe Straße, Hausnummer, PLZ und Ort.'
      );
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
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        geocoded_at: now,
        consent_terms: true,
        consent_terms_at: now,
        consent_privacy: true,
        consent_privacy_at: now,
      },
      { onConflict: 'user_id' }
    );

    setSaving(false);

    if (error) {
      return Alert.alert('Fehler', `Speichern: ${error.message}`);
    }

    setOriginalAddress({
      street: street.trim(),
      houseNo: houseNo.trim(),
      plz: plz.trim(),
      city: city.trim(),
    });

    Alert.alert('Gespeichert', 'Dein Profil wurde gespeichert.', [
      {
        text: 'Betriebe ansehen',
        onPress: () => router.replace('/azubi/companies'),
      },
      {
        text: 'OK',
      },
    ]);
  };

  const performDeleteAccount = async () => {
    if (deleting) {
      return;
    }

    setDeleting(true);

    const result = await deleteAccount();

    if (!result.success) {
      setDeleting(false);

      Alert.alert(
        'Fehler',
        'Dein Account konnte gerade nicht gelöscht werden. Bitte versuche es erneut.'
      );

      return;
    }

    router.replace('/');

    Alert.alert(
      'Account gelöscht',
      'Dein Account wurde dauerhaft gelöscht.'
    );
  };

  const onDeleteAccount = () => {
    if (deleting) {
      return;
    }

    Alert.alert(
      'Account dauerhaft löschen?',
      'Dein Account und alle damit verbundenen Profildaten werden dauerhaft gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Account endgültig löschen',
          style: 'destructive',
          onPress: performDeleteAccount,
        },
      ]
    );
  };

  const onLogout = async () => {
    if (deleting) {
      return;
    }

    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: 'center',
        }}
      >
        <Text>Lade...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          padding: 24,
          gap: 12,
          paddingBottom: 280,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
          }}
        >
          Azubi Profil
        </Text>

        <Pressable
          disabled={deleting}
          onPress={() => router.push('/azubi/companies')}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 10,
            alignItems: 'center',
            opacity: deleting
              ? 0.4
              : selectedTradeId
                ? 1
                : 0.6,
          }}
        >
          <Text style={{ fontWeight: '700' }}>
            Betriebe ansehen
          </Text>

          {!selectedTradeId && (
            <Text
              style={{
                marginTop: 4,
                color: '#6b7280',
              }}
            >
              (Tipp: erst Beruf auswählen für passende Treffer)
            </Text>
          )}
        </Pressable>

        <TextInput
          placeholder="Vorname"
          value={firstName}
          onChangeText={setFirstName}
          editable={!deleting}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="Nachname"
          value={lastName}
          onChangeText={setLastName}
          editable={!deleting}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="Straße"
          value={street}
          onChangeText={setStreet}
          editable={!deleting}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="Hausnummer"
          value={houseNo}
          onChangeText={setHouseNo}
          editable={!deleting}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="PLZ"
          value={plz}
          onChangeText={setPlz}
          editable={!deleting}
          keyboardType="number-pad"
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="Stadt"
          value={city}
          onChangeText={setCity}
          editable={!deleting}
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <Text
          style={{
            fontWeight: '700',
            marginTop: 6,
          }}
        >
          Beruf
        </Text>

        <View style={{ gap: 8 }}>
          {trades.map((t) => (
            <Pressable
              key={t.id}
              disabled={deleting}
              onPress={() => setSelectedTradeId(t.id)}
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 10,
                opacity: deleting
                  ? 0.4
                  : selectedTradeId === t.id
                    ? 1
                    : 0.7,
              }}
            >
              <Text
                style={{
                  fontWeight:
                    selectedTradeId === t.id ? '700' : '400',
                }}
              >
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          placeholder="E-Mail (optional, wenn WhatsApp-Link vorhanden)"
          value={email}
          onChangeText={setEmail}
          editable={!deleting}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="WhatsApp-Link (optional, wenn E-Mail vorhanden)"
          value={whatsappLink}
          onChangeText={setWhatsappLink}
          editable={!deleting}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        />

        <Pressable
          disabled={!isValid || saving || deleting}
          onPress={onSave}
          style={{
            marginTop: 10,
            padding: 14,
            borderWidth: 1,
            borderRadius: 10,
            alignItems: 'center',
            opacity:
              !isValid || saving || deleting ? 0.4 : 1,
          }}
        >
          <Text style={{ fontWeight: '700' }}>
            {saving ? 'Speichert...' : 'Speichern'}
          </Text>
        </Pressable>

        <Pressable
          disabled={deleting}
          onPress={onDeleteAccount}
          accessibilityRole="button"
          accessibilityLabel="Account dauerhaft löschen"
          style={{
            marginTop: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: '#dc2626',
            borderRadius: 10,
            alignItems: 'center',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              fontWeight: '700',
              color: '#dc2626',
            }}
          >
            {deleting
              ? 'Account wird gelöscht …'
              : 'Account löschen'}
          </Text>
        </Pressable>

        <Pressable
          disabled={deleting}
          onPress={onLogout}
          style={{
            marginTop: 30,
            padding: 14,
            borderWidth: 1,
            borderRadius: 10,
            alignItems: 'center',
            opacity: deleting ? 0.4 : 1,
          }}
        >
          <Text style={{ fontWeight: '700' }}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
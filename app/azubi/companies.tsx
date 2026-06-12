import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import LegalLinks from '@/components/LegalLinks';

type CompanyRow = {
  company_user_id: string;
  company_name: string | null;
  training_street: string | null;
  training_house_number: string | null;
  training_postal_code: string | null;
  training_city: string | null;
  phone: string | null;
  website: string | null;
  contact_email: string | null;
  distance_km: number | null;
};

type RadiusOption = {
  label: string;
  value: number | null;
};

const RADIUS_OPTIONS: RadiusOption[] = [
  { label: 'alle', value: null },
  { label: 'bis 5 km', value: 5 },
  { label: 'bis 10 km', value: 10 },
  { label: 'bis 25 km', value: 25 },
  { label: 'bis 50 km', value: 50 },
  { label: 'bis 75 km', value: 75 },
];

export default function AzubiCompanies() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const openPhone = async (phone: string | null) => {
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  };

  const openEmail = async (email: string | null) => {
    if (!email) return;
    await Linking.openURL(`mailto:${email}`);
  };

  const openWebsite = async (website: string | null) => {
    if (!website) return;

    const normalizedWebsite = website.startsWith('http')
      ? website
      : `https://${website}`;

    await Linking.openURL(normalizedWebsite);
  };

  const load = async (radiusKm: number | null = selectedRadiusKm) => {
    try {
      setError(null);
      setLoading(true);

      const { data: session, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const userId = session.session?.user.id;
      if (!userId) throw new Error('Nicht eingeloggt');

      const { data: azubi, error: azErr } = await supabase
        .from('azubi_profiles')
        .select('trade_id, latitude, longitude')
        .eq('user_id', userId)
        .maybeSingle();

      if (azErr) throw azErr;

      if (!azubi?.trade_id) {
        setTradeId(null);
        setTradeName(null);
        setCompanies([]);
        setError('Bitte zuerst einen Beruf im Profil auswählen.');
        return;
      }

      if (azubi.latitude == null || azubi.longitude == null) {
        setTradeId(azubi.trade_id);
        setCompanies([]);
        setError(
          'Bitte speichere zuerst dein Azubi-Profil mit gültiger Adresse.'
        );
        return;
      }

      setTradeId(azubi.trade_id);

      const { data: tr, error: trErr } = await supabase
        .from('trades')
        .select('name')
        .eq('id', azubi.trade_id)
        .maybeSingle();

      if (trErr) throw trErr;

      setTradeName(tr?.name ?? null);

      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'get_matching_companies_for_azubi',
        {
          p_azubi_user_id: userId,
          p_radius_km: radiusKm,
        }
      );

      if (rpcErr) throw rpcErr;

      setCompanies((rpcData ?? []) as CompanyRow[]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRadius = async (value: number | null) => {
    setSelectedRadiusKm(value);
    setFilterModalVisible(false);
    await load(value);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace('/(public)/welcome');
    } catch (e: any) {
      Alert.alert('Logout fehlgeschlagen', e?.message ?? 'Bitte erneut versuchen.');
    }
  };

  useEffect(() => {
    load(null);
  }, []);

  const headerText = useMemo(() => {
    if (!tradeId) return 'Bitte zuerst Beruf im Profil auswählen.';
    return tradeName ? `Betriebe für: ${tradeName}` : 'Passende Betriebe';
  }, [tradeId, tradeName]);

  const filterButtonTitle =
    selectedRadiusKm == null
      ? 'Entfernung filtern'
      : `Entfernung: bis ${selectedRadiusKm} km`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Lade Betriebe…</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Betriebe</Text>
        <Text style={styles.subtitle}>{headerText}</Text>

        <View style={{ height: 12 }} />

        <Button title="Aktualisieren" onPress={() => load()} />

        <View style={{ height: 12 }} />

        <Button
          title={filterButtonTitle}
          onPress={() => setFilterModalVisible(true)}
        />

        <View style={{ height: 12 }} />

        <Button title="Logout" onPress={handleLogout} />

        {error ? <Text style={styles.error}>Fehler: {error}</Text> : null}

        <View style={{ height: 16 }} />

        {companies.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Keine passenden Betriebe gefunden</Text>
            <Text style={styles.cardText}>
              Tipp: Prüfe deinen ausgewählten Beruf, deine Adresse oder den
              gesetzten Entfernungsfilter.
            </Text>
          </View>
        ) : (
          companies.map((c) => {
            const roundedDistance =
              typeof c.distance_km === 'number'
                ? Math.round(c.distance_km)
                : null;

            return (
              <View key={c.company_user_id} style={styles.card}>
                <Text style={styles.cardTitle}>{c.company_name ?? 'Betrieb'}</Text>

                <Text style={styles.cardText}>
                  {`${c.training_street ?? ''} ${
                    c.training_house_number ?? ''
                  }`.trim()}
                </Text>

                <Text style={styles.cardText}>
                  {`${c.training_postal_code ?? ''} ${
                    c.training_city ?? ''
                  }`.trim()}
                </Text>

                <Text style={styles.distanceText}>
                  Entfernung{' '}
                  {roundedDistance !== null ? `${roundedDistance} km` : '—'}
                </Text>

                <View style={styles.contactBlock}>
                  <Text style={styles.sectionTitle}>Kontakt</Text>

                  <Pressable
                    disabled={!c.phone}
                    onPress={() => openPhone(c.phone)}
                  >
                    <Text
                      style={[
                        styles.contactLink,
                        !c.phone ? styles.contactDisabled : null,
                      ]}
                    >
                      Telefon: {c.phone ?? '—'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={!c.contact_email}
                    onPress={() => openEmail(c.contact_email)}
                  >
                    <Text
                      style={[
                        styles.contactLink,
                        !c.contact_email ? styles.contactDisabled : null,
                      ]}
                    >
                      E-Mail: {c.contact_email ?? '—'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={!c.website}
                    onPress={() => openWebsite(c.website)}
                  >
                    <Text
                      style={[
                        styles.contactLink,
                        !c.website ? styles.contactDisabled : null,
                      ]}
                    >
                      Website: {c.website ?? '—'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 24 }} />

        <LegalLinks />
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Entfernung filtern</Text>

            {RADIUS_OPTIONS.map((option) => {
              const selected = selectedRadiusKm === option.value;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => handleSelectRadius(option.value)}
                  style={[
                    styles.modalOption,
                    selected ? styles.modalOptionSelected : null,
                  ]}
                >
                  <Text style={{ fontWeight: selected ? '700' : '400' }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setFilterModalVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={{ fontWeight: '700' }}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#6b7280' },
  error: { color: 'crimson', marginTop: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardText: { color: '#374151', marginTop: 6 },
  distanceText: {
    color: '#111827',
    marginTop: 10,
    fontWeight: '700',
  },
  contactBlock: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  contactLink: {
    color: '#2563eb',
    marginTop: 6,
  },
  contactDisabled: {
    color: '#9ca3af',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalOption: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
  },
  modalOptionSelected: {
    borderColor: '#111827',
    backgroundColor: '#f3f4f6',
  },
  modalCancel: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
  },
});
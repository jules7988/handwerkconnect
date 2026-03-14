import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { supabase } from "@/lib/supabase";

type CompanyRow = {
  user_id: string;
  company_name: string | null;
  plz: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
};

export default function AzubiCompanies() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const userId = session.session?.user.id;
      if (!userId) throw new Error('Nicht eingeloggt');

      const { data: azubi, error: azErr } = await supabase
        .from('azubi_profiles')
        .select('trade_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (azErr) throw azErr;

      if (!azubi?.trade_id) {
        setTradeId(null);
        setTradeName(null);
        setCompanies([]);
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

      const { data: ct, error: ctErr } = await supabase
        .from('company_trades')
        .select('company_id')
        .eq('trade_id', azubi.trade_id);

      if (ctErr) throw ctErr;

      const companyIds = (ct ?? [])
        .map((x: any) => x.company_id)
        .filter(Boolean);

      if (companyIds.length === 0) {
        setCompanies([]);
        return;
      }

      const { data: comps, error: compErr } = await supabase
        .from('companies')
        .select('user_id, company_name, plz, city, phone, website')
        .in('user_id', companyIds);

      if (compErr) throw compErr;

      const sorted = (comps ?? []).sort((a: any, b: any) =>
        String(a.company_name ?? '').localeCompare(String(b.company_name ?? ''))
      );

      setCompanies(sorted as CompanyRow[]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
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
    load();
  }, []);

  const headerText = useMemo(() => {
    if (!tradeId) return 'Bitte zuerst Beruf im Profil auswählen.';
    return tradeName ? `Betriebe für: ${tradeName}` : 'Passende Betriebe';
  }, [tradeId, tradeName]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Lade Betriebe…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Betriebe</Text>
      <Text style={styles.subtitle}>{headerText}</Text>

      <View style={{ height: 12 }} />
      <Button title="Aktualisieren" onPress={load} />
      <View style={{ height: 12 }} />
      <Button title="Logout" onPress={handleLogout} />

      {error ? (
        <Text style={styles.error}>Fehler: {error}</Text>
      ) : null}

      <View style={{ height: 16 }} />

      {companies.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Keine passenden Betriebe gefunden</Text>
          <Text style={styles.cardText}>
            Tipp: Prüfe deinen ausgewählten Beruf oder ob Betriebe diesen Beruf anbieten.
          </Text>
        </View>
      ) : (
        companies.map((c) => (
          <View key={c.user_id} style={styles.card}>
            <Text style={styles.cardTitle}>{c.company_name ?? 'Betrieb'}</Text>
            <Text style={styles.cardText}>
              Ort: {(c.plz ?? '') + ' ' + (c.city ?? '')}
            </Text>

            <View style={{ height: 10 }} />
            <Text style={styles.section}>Kontakt</Text>
            <Text style={styles.cardText}>Telefon: {c.phone ?? '—'}</Text>
            <Text style={styles.cardText}>Website: {c.website ?? '—'}</Text>
          </View>
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#6b7280' },
  error: { color: 'crimson', marginTop: 12 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardText: { color: '#374151', marginTop: 6 },
  section: { fontWeight: '700', marginTop: 6 },
});
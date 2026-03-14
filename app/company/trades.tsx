import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Trade = { id: string; name: string };

// companies hat KEIN id -> wir verwenden user_id (auth.user.id) als companyId
async function getMyCompanyId() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;
  return userId;
}

async function listTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as any) ?? [];
}

async function getSelectedTradeIds(companyId: string) {
  const { data, error } = await supabase
    .from("company_trades")
    .select("trade_id")
    .eq("company_id", companyId);

  if (error) throw error;
  return (data ?? []).map((x: any) => x.trade_id as string);
}

export default function CompanyTradesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const id = await getMyCompanyId();
        if (!id) {
          router.replace("/company/profile");
          return;
        }

        const [allTrades, selectedIds] = await Promise.all([
          listTrades(),
          getSelectedTradeIds(id),
        ]);

        if (!cancelled) {
          setCompanyId(id);
          setTrades(allTrades);
          setSelected(new Set(selectedIds));
        }
      } catch (e: any) {
        Alert.alert("Fehler", e?.message ?? "Konnte Berufe nicht laden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const selectedCount = useMemo(() => selected.size, [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSave() {
    if (!companyId) return;
    if (selected.size === 0) {
      return Alert.alert("Fehlt", "Bitte mindestens einen Beruf auswählen.");
    }

    setSaving(true);
    try {
      // MVP: löschen + neu schreiben
      const { error: delErr } = await supabase
        .from("company_trades")
        .delete()
        .eq("company_id", companyId);

      if (delErr) throw delErr;

      const rows = Array.from(selected).map((tradeId) => ({
        company_id: companyId,
        trade_id: tradeId,
      }));

      const { error: insErr } = await supabase.from("company_trades").insert(rows);
      if (insErr) throw insErr;

      router.replace("/company");
    } catch (e: any) {
      Alert.alert("Fehler", e?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Lade…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>
        Welche Berufe bietet ihr an?
      </Text>
      <Text style={{ color: "#666" }}>{selectedCount} ausgewählt</Text>

      <View style={{ gap: 10 }}>
        {trades.map((t) => {
          const isOn = selected.has(t.id);
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => toggle(t.id)}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: "#999",
                borderRadius: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontWeight: "500" }}>{t.name}</Text>
              <Text>{isOn ? "✅" : "⬜️"}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        style={{
          marginTop: 10,
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          borderWidth: 1,
          opacity: saving ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "600" }}>
          {saving ? "Speichere…" : "Fertig"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

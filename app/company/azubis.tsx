import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Trade = { id: string; name: string };

// ✅ TESTING BYPASS
const FORCE_VERIFIED_FOR_TESTING = true;

export default function CompanyAzubisScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [verified, setVerified] = useState(false);
  const [tradeMap, setTradeMap] = useState<Record<string, string>>({});
  const [azubis, setAzubis] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        router.replace("/(public)/welcome");
        return;
      }

      // 1) company status
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .select("verified")
        .eq("user_id", userId)
        .maybeSingle();

      if (companyErr) throw companyErr;

      // ✅ TESTING FIX
      const isVerified =
        FORCE_VERIFIED_FOR_TESTING || !!company?.verified;

      setVerified(isVerified);

      if (!isVerified) {
        setAzubis([]);
        return;
      }

      // 2) company trades
      const { data: ct, error: ctErr } = await supabase
        .from("company_trades")
        .select("trade_id")
        .eq("company_id", userId);

      if (ctErr) throw ctErr;

      const tradeIds = (ct ?? [])
        .map((x: any) => x.trade_id)
        .filter(Boolean);

      if (tradeIds.length === 0) {
        setAzubis([]);
        return;
      }

      // 3) trade names for display
      const { data: trades, error: tradesErr } = await supabase
        .from("trades")
        .select("id, name")
        .in("id", tradeIds);

      if (tradesErr) throw tradesErr;

      const map: Record<string, string> = {};

      (trades as Trade[] | null)?.forEach((t) => {
        map[t.id] = t.name;
      });

      setTradeMap(map);

      // 4) azubis matching those tradeIds
      const { data: az, error: azErr } = await supabase
        .from("azubi_profiles")
        .select(
          "user_id, first_name, last_name, plz, city, email, whatsapp_link, trade_id, created_at"
        )
        .in("trade_id", tradeIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (azErr) throw azErr;

      setAzubis(az ?? []);
    } catch (e: any) {
      Alert.alert(
        "Fehler",
        e?.message ?? "Konnte Azubis nicht laden."
      );
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await load();

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const count = useMemo(() => azubis.length, [azubis]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function labelTrade(tradeId: string | null | undefined) {
    if (!tradeId) return "—";
    return tradeMap[tradeId] ?? tradeId;
  }

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Lade…</Text>
      </View>
    );
  }

  if (!verified) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          Azubis
        </Text>

        <View
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Noch nicht verifiziert
          </Text>

          <Text
            style={{
              marginTop: 8,
              color: "#666",
            }}
          >
            Sobald dein Betrieb verifiziert ist,
            siehst du hier passende Azubis.
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
            opacity: refreshing ? 0.6 : 1,
          }}
          disabled={refreshing}
        >
          <Text>
            {refreshing
              ? "Aktualisiere…"
              : "Aktualisieren"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>
        Azubis
      </Text>

      <Text style={{ color: "#666" }}>
        {count} Treffer
      </Text>

      <TouchableOpacity
        onPress={onRefresh}
        style={{
          padding: 12,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: "center",
          opacity: refreshing ? 0.6 : 1,
        }}
        disabled={refreshing}
      >
        <Text>
          {refreshing
            ? "Aktualisiere…"
            : "Aktualisieren"}
        </Text>
      </TouchableOpacity>

      {azubis.length === 0 ? (
        <View
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Keine passenden Azubis gefunden
          </Text>

          <Text
            style={{
              marginTop: 8,
              color: "#666",
            }}
          >
            Tipp: Prüfe, ob du Berufe ausgewählt hast
            und ob es passende Azubi-Profile gibt.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {azubis.map((a, idx) => {
            const firstName = a.first_name ?? "";
            const lastName = a.last_name ?? "";

            const displayName =
              (
                String(firstName).trim() +
                " " +
                String(lastName).trim()
              ).trim() || "Azubi";

            const email = a.email ?? "";
            const city = a.city ?? "";
            const plz = a.plz ?? "";
            const whatsapp = a.whatsapp_link ?? "";

            const tradeId = a.trade_id;

            return (
              <View
                key={a.user_id ?? idx}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {displayName}
                </Text>

                <Text style={{ color: "#666" }}>
                  Sucht Ausbildung: {labelTrade(tradeId)}
                </Text>

                <Text style={{ color: "#666" }}>
                  Wohnort: {plz ? `${plz} ` : ""}
                  {city || "—"}
                </Text>

                <View style={{ height: 8 }} />

                <Text style={{ fontWeight: "600" }}>
                  Kontakt
                </Text>

                <TouchableOpacity
                  disabled={!email}
                  onPress={() =>
                    Linking.openURL(`mailto:${email}`)
                  }
                >
                  <Text style={{ color: email ? "#2563eb" : "#111" }}>
                    Email: {email || "—"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!whatsapp}
                  onPress={() => {
                    const raw = String(whatsapp).trim();

                    if (raw.startsWith("http")) {
                      Linking.openURL(raw);
                      return;
                    }

                    const phone = raw.replace(/[^\d+]/g, "");

                    Linking.openURL(
                      `https://wa.me/${phone.replace("+", "")}`
                    );
                  }}
                >
                  <Text style={{ color: whatsapp ? "#2563eb" : "#111" }}>
                    WhatsApp: {whatsapp || "—"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
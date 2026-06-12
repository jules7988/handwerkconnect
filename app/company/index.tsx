import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import LegalLinks from "@/components/LegalLinks";

const FORCE_VERIFIED_FOR_TESTING = true;

export default function CompanyDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (FORCE_VERIFIED_FOR_TESTING) {
          if (!cancelled) {
            setVerified(true);
            setLoading(false);
          }
          return;
        }

        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const userId = auth.user?.id;
        if (!userId) throw new Error("Nicht eingeloggt.");

        const { data, error } = await supabase
          .from("companies")
          .select("verified")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) setVerified(!!data?.verified);
      } catch (e: any) {
        Alert.alert("Fehler", e?.message ?? "Konnte Status nicht laden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace("/(public)/welcome");
    } catch (e: any) {
      Alert.alert("Logout fehlgeschlagen", e?.message ?? "Bitte erneut versuchen.");
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
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Dashboard</Text>

      {!verified ? (
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Status: Wird geprüft
          </Text>
          <Text style={{ marginTop: 8, color: "#666" }}>
            Wir prüfen kurz deinen Betrieb, um Fake-Accounts zu verhindern.
            Danach bekommst du Zugriff auf passende Azubis.
          </Text>
        </View>
      ) : (
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Status: Verifiziert ✅
          </Text>
          <Text style={{ marginTop: 8, color: "#666" }}>
            Du hast jetzt Zugriff auf passende Azubis.
          </Text>
        </View>
      )}

      {verified && (
        <TouchableOpacity
          onPress={() => router.push("/company/azubis")}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600" }}>Azubis anzeigen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={logout}
        style={{
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text>Logout</Text>
      </TouchableOpacity>

      <LegalLinks />
    </ScrollView>
  );
}
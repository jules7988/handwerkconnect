import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import LegalLinks from "@/components/LegalLinks";

type Company = {
  verified: boolean | null;
  company_name: string | null;
  training_street: string | null;
  training_house_number: string | null;
  training_postal_code: string | null;
  training_city: string | null;
  phone: string | null;
  contact_email: string | null;
  website: string | null;
};

export default function CompanyDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  const verified = !!company?.verified;

  const loadCompany = useCallback(async () => {
    setLoading(true);

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const userId = auth.user?.id;
      if (!userId) {
        router.replace("/(public)/welcome");
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select(
          "verified, company_name, training_street, training_house_number, training_postal_code, training_city, phone, contact_email, website"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      setCompany(data ?? null);
    } catch (e: any) {
      Alert.alert("Fehler", e?.message ?? "Konnte Dashboard nicht laden.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany])
  );

  function openAzubis() {
    if (!verified) {
      Alert.alert(
        "Verifizierung erforderlich",
        "Bevor Sie passende Azubis sehen können, ist erst eine Verifizierung notwendig. Bitte haben Sie noch ein wenig Geduld. Es ist uns wichtig, die Daten der Azubis zu schützen."
      );
      return;
    }

    router.push("/company/azubis");
  }

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

      <View style={{ padding: 14, borderWidth: 1, borderRadius: 12 }}>
        {verified ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              Status: Verifiziert ✅
            </Text>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Du hast jetzt Zugriff auf passende Azubis.
            </Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              Status: Wird geprüft
            </Text>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Dein Betrieb wird aktuell geprüft.
              {"\n\n"}
              Sobald wir deine Angaben verifiziert haben, erhältst du Zugriff
              auf passende Ausbildungsinteressierte.
              {"\n\n"}
              Die Prüfung erfolgt in der Regel innerhalb von 1–2 Werktagen.
            </Text>
          </>
        )}
      </View>

      <View style={{ padding: 14, borderWidth: 1, borderRadius: 12, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>Betriebsdaten</Text>

        <InfoRow label="Betrieb" value={company?.company_name} />
        <InfoRow
          label="Adresse"
          value={[company?.training_street, company?.training_house_number]
            .filter(Boolean)
            .join(" ")}
        />
        <InfoRow
          label="Ort"
          value={[company?.training_postal_code, company?.training_city]
            .filter(Boolean)
            .join(" ")}
        />
        <InfoRow label="Telefon" value={company?.phone} />
        <InfoRow label="E-Mail" value={company?.contact_email} />
        <InfoRow label="Webseite" value={company?.website} />
      </View>

      <TouchableOpacity
        onPress={() => router.push("/company/profile")}
        style={{
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "600" }}>Betriebsdaten bearbeiten</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openAzubis}
        style={{
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "600" }}>Azubis anzeigen</Text>
      </TouchableOpacity>

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

function InfoRow(props: { label: string; value?: string | null }) {
  return (
    <View>
      <Text style={{ fontWeight: "600" }}>{props.label}</Text>
      <Text style={{ color: "#666", marginTop: 2 }}>
        {props.value && props.value.trim() ? props.value : "—"}
      </Text>
    </View>
  );
}
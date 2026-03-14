import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function CompanyProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [postalCode, setPostalCode] = useState(""); // maps to DB column: plz
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled && data) {
          // ✅ match your DB schema
          setName(data.company_name ?? "");
          setContactName(data.contact_person ?? "");
          setPhone(data.phone ?? "");
          setWebsite(data.website ?? "");
          setPostalCode(data.plz ?? "");
          setCity(data.city ?? "");

          // consent can be stored in multiple fields; for UI we use a single toggle
          setConsent(!!data.consent);
        }
      } catch (e: any) {
        Alert.alert("Fehler", e?.message ?? "Konnte Profil nicht laden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    if (!name.trim()) return Alert.alert("Fehlt", "Bitte Firmenname eintragen.");
    if (!postalCode.trim()) return Alert.alert("Fehlt", "Bitte PLZ eintragen.");
    if (!consent)
      return Alert.alert("Einwilligung", "Bitte Consent bestätigen.");

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Nicht eingeloggt.");

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("companies")
        .upsert(
          {
            user_id: userId,

            // ✅ match your DB schema
            company_name: name.trim(),
            contact_person: contactName.trim() || null,
            phone: phone.trim() || null,
            website: website.trim() || null,
            plz: postalCode.trim(),
            city: city.trim() || null,

            // ✅ consent fields that exist in your table
            consent: true,
            consent_terms: true,
            consent_privacy: true,
            consent_terms_at: now,
            consent_privacy_at: now,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      router.replace("/company/trades");
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
      <Text style={{ fontSize: 16, fontWeight: "600" }}>Betriebsprofil</Text>

      <Field label="Firmenname *" value={name} onChangeText={setName} />
      <Field
        label="Ansprechpartner"
        value={contactName}
        onChangeText={setContactName}
      />
      <Field
        label="Telefon"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Field
        label="Website"
        value={website}
        onChangeText={setWebsite}
        autoCapitalize="none"
      />
      <Field
        label="PLZ *"
        value={postalCode}
        onChangeText={setPostalCode}
        keyboardType="number-pad"
      />
      <Field label="Stadt" value={city} onChangeText={setCity} />

      <TouchableOpacity
        onPress={() => setConsent((v) => !v)}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: "#999",
          borderRadius: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text>Einwilligung (Consent) *</Text>
        <Text>{consent ? "✅" : "⬜️"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        style={{
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          borderWidth: 1,
          opacity: saving ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "600" }}>
          {saving ? "Speichere…" : "Weiter"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "#444" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        style={{
          borderWidth: 1,
          borderColor: "#999",
          borderRadius: 8,
          padding: 12,
        }}
      />
    </View>
  );
}

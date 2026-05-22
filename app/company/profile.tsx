import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [trainingStreet, setTrainingStreet] = useState("");
  const [trainingHouseNumber, setTrainingHouseNumber] = useState("");
  const [trainingPostalCode, setTrainingPostalCode] = useState("");
  const [trainingCity, setTrainingCity] = useState("");

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
          setName(data.company_name ?? "");
          setContactName(data.contact_person ?? "");
          setPhone(data.phone ?? "");
          setContactEmail(data.contact_email ?? "");
          setWebsite(data.website ?? "");

          setTrainingStreet(data.training_street ?? "");
          setTrainingHouseNumber(data.training_house_number ?? "");
          setTrainingPostalCode(data.training_postal_code ?? data.plz ?? "");
          setTrainingCity(data.training_city ?? data.city ?? "");

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

  async function geocodeTrainingAddress() {
    const { data, error } = await supabase.functions.invoke("geocode-address", {
      body: {
        street: trainingStreet.trim(),
        houseNumber: trainingHouseNumber.trim(),
        postalCode: trainingPostalCode.trim(),
        city: trainingCity.trim(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const latitude = Number(data?.latitude);
    const longitude = Number(data?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("INVALID_COORDINATES");
    }

    return { latitude, longitude };
  }

  async function onSave() {
    if (!name.trim()) return Alert.alert("Fehlt", "Bitte Firmenname eintragen.");

    if (!contactName.trim()) {
      return Alert.alert("Fehlt", "Bitte Ansprechpartner eintragen.");
    }

    if (!trainingStreet.trim()) {
      return Alert.alert("Fehlt", "Bitte Straße des Ausbildungsstandorts eintragen.");
    }

    if (!trainingHouseNumber.trim()) {
      return Alert.alert(
        "Fehlt",
        "Bitte Hausnummer des Ausbildungsstandorts eintragen."
      );
    }

    if (!trainingPostalCode.trim()) {
      return Alert.alert("Fehlt", "Bitte PLZ des Ausbildungsstandorts eintragen.");
    }

    if (!trainingCity.trim()) {
      return Alert.alert("Fehlt", "Bitte Stadt des Ausbildungsstandorts eintragen.");
    }

    if (!consent) {
      return Alert.alert("Einwilligung", "Bitte Consent bestätigen.");
    }

    setSaving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Nicht eingeloggt.");

      const coordinates = await geocodeTrainingAddress();

      const now = new Date().toISOString();

      const { error } = await supabase.from("companies").upsert(
        {
          user_id: userId,

          company_name: name.trim(),
          contact_person: contactName.trim(),
          phone: phone.trim() || null,
          contact_email: contactEmail.trim() || null,
          website: website.trim() || null,

          training_street: trainingStreet.trim(),
          training_house_number: trainingHouseNumber.trim(),
          training_postal_code: trainingPostalCode.trim(),
          training_city: trainingCity.trim(),

          plz: trainingPostalCode.trim(),
          city: trainingCity.trim(),

          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          geocoded_at: now,

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
      const message = String(e?.message ?? "");

      if (
        message.includes("FunctionsHttpError") ||
        message.includes("ADDRESS_NOT_FOUND") ||
        message.includes("GEOCODING_FAILED") ||
        message.includes("INVALID_COORDINATES") ||
        message.includes("INTERNAL_ERROR")
      ) {
        Alert.alert(
          "Ausbildungsstandort nicht gefunden",
          "Ausbildungsstandort konnte nicht eindeutig gefunden werden. Bitte überprüfe Straße, Hausnummer, PLZ und Stadt."
        );
      } else {
        Alert.alert("Fehler", e?.message ?? "Speichern fehlgeschlagen.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text>Lade…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 140,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Betriebsprofil</Text>

        <Field label="Firmenname *" value={name} onChangeText={setName} />

        <Field
          label="Ansprechpartner *"
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
          label="Kontakt E-Mail-Adresse"
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Field
          label="Website"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginTop: 8,
          }}
        >
          Ausbildungsstandort
        </Text>

        <Field
          label="Straße *"
          value={trainingStreet}
          onChangeText={setTrainingStreet}
        />

        <Field
          label="Hausnummer *"
          value={trainingHouseNumber}
          onChangeText={setTrainingHouseNumber}
        />

        <Field
          label="PLZ *"
          value={trainingPostalCode}
          onChangeText={setTrainingPostalCode}
          keyboardType="number-pad"
        />

        <Field
          label="Stadt *"
          value={trainingCity}
          onChangeText={setTrainingCity}
        />

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
    </KeyboardAvoidingView>
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
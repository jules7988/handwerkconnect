# AzuConnect

AzuConnect verbindet Ausbildungsinteressierte und Azubis mit Handwerksbetrieben.

## MVP

Der aktuelle MVP ermöglicht:

- Registrierung als Azubi oder Betrieb
- Bestätigung der E-Mail-Adresse
- Erstellung und Bearbeitung von Profilen
- Suche nach verifizierten Handwerksbetrieben
- Anzeige von Ausbildungsberufen
- Entfernungssuche
- Kontaktaufnahme per Telefon, E-Mail oder WhatsApp
- Passwort-Zurücksetzung
- Datenschutz- und Impressumsseiten

## Technologie

- React Native
- Expo
- Expo Router
- TypeScript
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Edge Functions
- Resend für transaktionale E-Mails

## Technische Hinweise

Der sichtbare Produktname ist **AzuConnect**.

Einige technische Kennungen bleiben zur Wahrung der Kompatibilität mit den bestehenden App-Store- und Backend-Konfigurationen unverändert:

- Expo-Slug: `handwerkconnect`
- URL-Scheme: `handwerkconnect`
- iOS Bundle Identifier: `com.jules88.handwerkconnect`
- Android Package: `com.jules88.handwerkconnect`

Diese technischen Kennungen sind nicht mit dem sichtbaren Produktnamen gleichzusetzen.

## Authentifizierungsarchitektur

Bei der Registrierung schreibt die App nicht direkt in die Tabelle `profiles`.

Der Ablauf ist:

1. Die App registriert den Nutzer über Supabase Auth.
2. Rolle und Datenschutzinformationen werden als Auth-Metadaten übermittelt.
3. Der Datenbank-Trigger `handle_new_auth_user()` erstellt das zugehörige Profil.
4. Der Nutzer bestätigt seine E-Mail-Adresse.
5. Nach dem Login wird anhand der Rolle zum passenden Profil weitergeleitet.

## Datenschutz

Bei der Registrierung werden folgende Informationen zur Einwilligung gespeichert:

- Zeitpunkt der Zustimmung
- Version der Datenschutzerklärung

Aktuelle Datenschutzversion:

```text
v2

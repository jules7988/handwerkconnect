import React, { useEffect, useState } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "@/lib/supabase";

async function getMyCompany() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { userId: null as string | null, company: null as any };

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return { userId, company: data };
}

async function getMyCompanyTrades(companyId: string) {
  const { data, error } = await supabase
    .from("company_trades")
    .select("trade_id")
    .eq("company_id", companyId);

  if (error) throw error;
  return (data ?? []).map((x: any) => x.trade_id as string);
}

export default function CompanyLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      try {
        const { userId, company } = await getMyCompany();

        // not logged in -> send to profile (oder dein auth flow)
        if (!userId) {
          if (!cancelled && pathname !== "/company/profile") {
            router.replace("/company/profile");
          }
          return;
        }

        // Wenn noch kein company Datensatz → zuerst Profil
        if (!company) {
          if (!cancelled && pathname !== "/company/profile") {
            router.replace("/company/profile");
          }
          return;
        }

        // ✅ Minimal-Kriterium für „Profil vollständig“ (dein Schema!)
        const profileComplete = !!company.company_name && !!company.plz;
        if (!profileComplete) {
          if (!cancelled && pathname !== "/company/profile") {
            router.replace("/company/profile");
          }
          return;
        }

        // Trades Pflicht im MVP
        // ✅ companyId = userId (weil companies hat kein id)
        const tradeIds = await getMyCompanyTrades(userId);
        if (tradeIds.length === 0) {
          if (!cancelled && pathname !== "/company/trades") {
            router.replace("/company/trades");
          }
          return;
        }

        // Alles ok → Dashboard (index)
        if (
          !cancelled &&
          (pathname === "/company/profile" || pathname === "/company/trades")
        ) {
          router.replace("/company");
        }
      } catch {
        if (!cancelled) router.replace("/company/profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Betrieb" }} />
      <Stack.Screen name="profile" options={{ title: "Betriebsprofil" }} />
      <Stack.Screen name="trades" options={{ title: "Berufe" }} />
    </Stack>
  );
}

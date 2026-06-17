import React, { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

async function getMyCompany() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return { userId: null as string | null, company: null as any };
  }

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

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      try {
        const { userId, company } = await getMyCompany();

        if (cancelled) return;

        if (!userId) {
          router.replace("/(public)/welcome");
          return;
        }

        if (!company) {
          if (pathname !== "/company/profile") {
            router.replace("/company/profile");
          }
          return;
        }

        const profileComplete =
          !!company.company_name &&
          !!company.contact_person &&
          !!company.training_street &&
          !!company.training_house_number &&
          !!company.training_postal_code &&
          !!company.training_city;

        if (!profileComplete) {
          if (pathname !== "/company/profile") {
            router.replace("/company/profile");
          }
          return;
        }

        const tradeIds = await getMyCompanyTrades(userId);

        if (cancelled) return;

        if (tradeIds.length === 0) {
          if (pathname !== "/company/trades") {
            router.replace("/company/trades");
          }
          return;
        }

        // Wichtig:
        // Kein Redirect von /company/profile zurück nach /company.
        // Profil und Berufe dürfen bewusst später bearbeitet werden.
      } catch {
        if (!cancelled && pathname !== "/company/profile") {
          router.replace("/company/profile");
        }
      }
    }

    guard();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Betrieb" }} />
      <Stack.Screen name="profile" options={{ title: "Betriebsprofil" }} />
      <Stack.Screen name="trades" options={{ title: "Berufe" }} />
      <Stack.Screen name="azubis" options={{ title: "Azubis" }} />
    </Stack>
  );
}
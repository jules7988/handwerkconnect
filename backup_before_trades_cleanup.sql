


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."account_status" AS ENUM (
    'active',
    'blocked'
);


ALTER TYPE "public"."account_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'azubi',
    'betrieb',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_azubis"("radius_km" double precision DEFAULT 50, "trade_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS TABLE("azubi_user_id" "uuid", "first_name" "text", "last_name" "text", "trade_id" "uuid", "trade_name" "text", "azubi_plz" "text", "azubi_city" "text", "email" "public"."citext", "whatsapp_link" "text", "distance_km" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  is_verified boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select c.verified into is_verified
  from public.companies c
  where c.user_id = auth.uid();

  if is_verified is distinct from true then
    raise exception 'company not verified';
  end if;

  return query
  select
    v.azubi_user_id,
    v.first_name,
    v.last_name,
    v.trade_id,
    v.trade_name,
    v.azubi_plz,
    v.azubi_city,
    v.email,
    v.whatsapp_link,
    v.distance_km
  from public.v_company_azubi_matches v
  join public.profiles p_a on p_a.user_id = v.azubi_user_id
  where v.company_user_id = auth.uid()
    and p_a.status = 'active'
    and v.distance_km <= radius_km
    and (trade_ids is null or v.trade_id = any(trade_ids))
  order by v.distance_km asc;
end;
$$;


ALTER FUNCTION "public"."get_company_azubis"("radius_km" double precision, "trade_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_matching_companies_for_azubi"("p_azubi_user_id" "uuid", "p_radius_km" integer DEFAULT NULL::integer) RETURNS TABLE("company_user_id" "uuid", "company_name" "text", "training_street" "text", "training_house_number" "text", "training_postal_code" "text", "training_city" "text", "phone" "text", "website" "text", "contact_email" "text", "distance_km" double precision)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  with azubi as (
    select
      ap.trade_id,
      ap.latitude as azubi_lat,
      ap.longitude as azubi_lng
    from public.azubi_profiles ap
    where ap.user_id = p_azubi_user_id
      and ap.latitude is not null
      and ap.longitude is not null
    limit 1
  ),
  companies_with_distance as (
    select
      c.user_id as company_user_id,
      c.company_name,
      c.training_street,
      c.training_house_number,
      c.training_postal_code,
      c.training_city,
      c.phone,
      c.website,
      c.contact_email,
      (
        6371 * acos(
          cos(radians(a.azubi_lat))
          * cos(radians(c.latitude))
          * cos(radians(c.longitude) - radians(a.azubi_lng))
          + sin(radians(a.azubi_lat))
          * sin(radians(c.latitude))
        )
      ) as distance_km
    from public.companies c
    inner join public.company_trades ct
      on ct.company_id = c.user_id
    cross join azubi a
    where
      ct.trade_id = a.trade_id
      and c.latitude is not null
      and c.longitude is not null
  )
  select *
  from companies_with_distance
  where
    p_radius_km is null
    or distance_km <= p_radius_km
  order by
    distance_km asc,
    company_name asc;
$$;


ALTER FUNCTION "public"."get_matching_companies_for_azubi"("p_azubi_user_id" "uuid", "p_radius_km" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  role_text text;
begin
  role_text := coalesce(new.raw_user_meta_data->>'role', 'azubi');

  insert into public.profiles (user_id, role)
  values (new.id, role_text::public.user_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."haversine_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) RETURNS double precision
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians((lon2 - lon1) / 2)), 2)
    )
  );
$$;


ALTER FUNCTION "public"."haversine_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."azubi_profiles" (
    "user_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "street" "text" NOT NULL,
    "house_no" "text" NOT NULL,
    "plz" "text" NOT NULL,
    "city" "text" NOT NULL,
    "trade_id" "uuid" NOT NULL,
    "email" "public"."citext",
    "whatsapp_link" "text",
    "consent_terms" boolean DEFAULT false NOT NULL,
    "consent_terms_at" timestamp with time zone,
    "consent_privacy" boolean DEFAULT false NOT NULL,
    "consent_privacy_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    "geocoded_at" timestamp with time zone,
    CONSTRAINT "chk_azubi_contact" CHECK (((("email" IS NOT NULL) AND ("length"(("email")::"text") > 3)) OR (("whatsapp_link" IS NOT NULL) AND ("length"("whatsapp_link") > 10))))
);


ALTER TABLE "public"."azubi_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "website" "text",
    "plz" "text" NOT NULL,
    "city" "text" NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "consent_terms" boolean DEFAULT false NOT NULL,
    "consent_terms_at" timestamp with time zone,
    "consent_privacy" boolean DEFAULT false NOT NULL,
    "consent_privacy_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consent" boolean DEFAULT false NOT NULL,
    "postal_code" "text",
    "training_street" "text",
    "training_house_number" "text",
    "training_postal_code" "text",
    "training_city" "text",
    "contact_email" "text",
    "latitude" double precision,
    "longitude" double precision,
    "geocoded_at" timestamp with time zone
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_trades" (
    "company_id" "uuid" NOT NULL,
    "trade_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_trades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."postal_codes_de" (
    "plz" "text" NOT NULL,
    "city" "text",
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL
);


ALTER TABLE "public"."postal_codes_de" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "status" "public"."account_status" DEFAULT 'active'::"public"."account_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trades" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_company_azubi_matches" AS
 SELECT "c"."user_id" AS "company_user_id",
    "a"."user_id" AS "azubi_user_id",
    "a"."first_name",
    "a"."last_name",
    "a"."city" AS "azubi_city",
    "a"."plz" AS "azubi_plz",
    "a"."trade_id",
    "t"."name" AS "trade_name",
    "a"."email",
    "a"."whatsapp_link",
    "public"."haversine_km"("pc_c"."lat", "pc_c"."lng", "pc_a"."lat", "pc_a"."lng") AS "distance_km"
   FROM (((("public"."companies" "c"
     JOIN "public"."postal_codes_de" "pc_c" ON (("pc_c"."plz" = "c"."plz")))
     JOIN "public"."azubi_profiles" "a" ON (true))
     JOIN "public"."postal_codes_de" "pc_a" ON (("pc_a"."plz" = "a"."plz")))
     JOIN "public"."trades" "t" ON (("t"."id" = "a"."trade_id")))
  WHERE ("t"."active" = true);


ALTER VIEW "public"."v_company_azubi_matches" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."azubi_profiles"
    ADD CONSTRAINT "azubi_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."company_trades"
    ADD CONSTRAINT "company_trades_pkey" PRIMARY KEY ("company_id", "trade_id");



ALTER TABLE ONLY "public"."postal_codes_de"
    ADD CONSTRAINT "postal_codes_de_pkey" PRIMARY KEY ("plz");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_azubi_plz" ON "public"."azubi_profiles" USING "btree" ("plz");



CREATE INDEX "idx_azubi_trade" ON "public"."azubi_profiles" USING "btree" ("trade_id");



CREATE OR REPLACE TRIGGER "trg_azubi_updated_at" BEFORE UPDATE ON "public"."azubi_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."azubi_profiles"
    ADD CONSTRAINT "azubi_profiles_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id");



ALTER TABLE ONLY "public"."azubi_profiles"
    ADD CONSTRAINT "azubi_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_trades"
    ADD CONSTRAINT "fk_company_trades_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_trades"
    ADD CONSTRAINT "fk_company_trades_trade" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "azubi_admin_all" ON "public"."azubi_profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."azubi_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "azubi_profiles_select_authenticated" ON "public"."azubi_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "azubi_profiles_select_own" ON "public"."azubi_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "azubi_self_delete" ON "public"."azubi_profiles" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "azubi_self_insert" ON "public"."azubi_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "azubi_self_read" ON "public"."azubi_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "azubi_self_update" ON "public"."azubi_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_select_verified" ON "public"."companies" FOR SELECT TO "authenticated" USING (("verified" = true));



CREATE POLICY "company_admin_all" ON "public"."companies" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "company_self_delete" ON "public"."companies" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "company_self_insert" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "company_self_read" ON "public"."companies" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "company_self_update" ON "public"."companies" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."company_trades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_trades_select_all" ON "public"."company_trades" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "company_trades_self_all" ON "public"."company_trades" TO "authenticated" USING ((("company_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("company_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_all" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_self_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_self_read" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."trades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trades_admin_write" ON "public"."trades" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "trades_read_all" ON "public"."trades" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "trades_select_all" ON "public"."trades" FOR SELECT TO "authenticated" USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_company_azubis"("radius_km" double precision, "trade_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_company_azubis"("radius_km" double precision, "trade_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_azubis"("radius_km" double precision, "trade_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_azubis"("radius_km" double precision, "trade_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_matching_companies_for_azubi"("p_azubi_user_id" "uuid", "p_radius_km" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_matching_companies_for_azubi"("p_azubi_user_id" "uuid", "p_radius_km" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_matching_companies_for_azubi"("p_azubi_user_id" "uuid", "p_radius_km" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."haversine_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."haversine_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."haversine_km"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."azubi_profiles" TO "anon";
GRANT ALL ON TABLE "public"."azubi_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."azubi_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_trades" TO "anon";
GRANT ALL ON TABLE "public"."company_trades" TO "authenticated";
GRANT ALL ON TABLE "public"."company_trades" TO "service_role";



GRANT ALL ON TABLE "public"."postal_codes_de" TO "anon";
GRANT ALL ON TABLE "public"."postal_codes_de" TO "authenticated";
GRANT ALL ON TABLE "public"."postal_codes_de" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."trades" TO "anon";
GRANT ALL ON TABLE "public"."trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trades" TO "service_role";



GRANT ALL ON TABLE "public"."v_company_azubi_matches" TO "anon";
GRANT ALL ON TABLE "public"."v_company_azubi_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."v_company_azubi_matches" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








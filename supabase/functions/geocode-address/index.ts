import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();

    const street = String(body.street ?? "").trim();
    const houseNumber = String(body.houseNumber ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const city = String(body.city ?? "").trim();

    if (!street || !houseNumber || !postalCode || !city) {
      return new Response(
        JSON.stringify({ error: "MISSING_FIELDS" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const query = encodeURIComponent(
      `${street} ${houseNumber}, ${postalCode} ${city}, Deutschland`
    );

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${query}` +
      `&format=json` +
      `&limit=1` +
      `&countrycodes=de` +
      `&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "AzuConnect-MVP/0.1.2",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "GEOCODING_FAILED" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ error: "ADDRESS_NOT_FOUND" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = results[0];

    const latitude = Number.parseFloat(result.lat);
    const longitude = Number.parseFloat(result.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return new Response(
        JSON.stringify({ error: "INVALID_COORDINATES" }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        latitude,
        longitude,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
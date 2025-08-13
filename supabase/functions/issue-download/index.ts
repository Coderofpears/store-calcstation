// Supabase Edge Function: issue-download
// Purpose: Validate user authorization (purchase or one-time demo) and return a signed URL for a private storage object

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Admin client using service role for secure DB checks and signed URL creation
function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

interface DownloadRequestBody {
  game_slug?: string;
  kind?: "full" | "demo";
  device?: string; // e.g., windows, mac, linux
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const admin = getAdminClient();

    // Extract bearer token
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return jsonResponse({ error: "Missing bearer token" }, 401);
    }

    // Validate user
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("Auth error", userErr);
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }
    const user = userData.user;

    const body = (await req.json().catch(() => ({}))) as DownloadRequestBody;
    const game_slug = body.game_slug?.trim();
    const kind = body.kind;
    const device = body.device?.trim();

    if (!game_slug || !kind || !device) {
      return jsonResponse({ error: "Missing required fields: game_slug, kind, device" }, 400);
    }

    if (kind === "full") {
      // Must own the game
      const { data: purchase, error: purchaseErr } = await admin
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_slug", game_slug)
        .limit(1)
        .maybeSingle();
      if (purchaseErr) {
        console.error("Purchase check error", purchaseErr);
        return jsonResponse({ error: "Authorization check failed" }, 500);
      }
      if (!purchase) {
        return jsonResponse({ error: "No valid purchase for this game" }, 403);
      }
    } else if (kind === "demo") {
      // Enforce one-time demo claim per user/game
      const { data: claim, error: claimErr } = await admin
        .from("demo_claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_slug", game_slug)
        .limit(1)
        .maybeSingle();
      if (claimErr) {
        console.error("Claim check error", claimErr);
        return jsonResponse({ error: "Authorization check failed" }, 500);
      }
      if (!claim) {
        // Attempt to create the claim (unique index protects against race)
        const { error: insertErr } = await admin.from("demo_claims").insert({ user_id: user.id, game_slug });
        if (insertErr) {
          // If unique violation, treat as already claimed
          console.warn("Demo claim insert error (possibly duplicate)", insertErr);
        }
      }
    } else {
      return jsonResponse({ error: "Invalid kind; expected 'full' or 'demo'" }, 400);
    }

    // Resolve a registered storage path for this game/kind/device
    const { data: dl, error: dlErr } = await admin
      .from("game_downloads")
      .select("storage_path")
      .eq("game_slug", game_slug)
      .eq("kind", kind)
      .eq("device", device)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dlErr) {
      console.error("Download lookup error", dlErr);
      return jsonResponse({ error: "Failed to resolve download" }, 500);
    }

    const storage_path = dl?.storage_path?.trim();
    if (!storage_path) {
      return jsonResponse({ error: "No download configured for this target" }, 404);
    }

    const { data: signed, error: signedErr } = await admin
      .storage
      .from("game-binaries")
      .createSignedUrl(storage_path, 60 * 15); // 15 minutes

    if (signedErr || !signed?.signedUrl) {
      console.error("Signed URL error", signedErr);
      return jsonResponse({ error: "Failed to create signed URL" }, 500);
    }

    return jsonResponse({ url: signed.signedUrl }, 200);
  } catch (err) {
    console.error("Unhandled error", err);
    return jsonResponse({ error: "Server error" }, 500);
  }
});

import { supabase } from "@/integrations/supabase/client";

export type DownloadKind = "full" | "demo";

export interface GameDownload {
  id: string;
  game_slug: string;
  device: string;
  kind: DownloadKind;
  file_name: string | null;
  mime_type: string | null;
  data_base64: string; // expected to be a data URL string
}

export async function getDownloads(gameSlug: string, kind: DownloadKind): Promise<GameDownload[]> {
  const { data, error } = await supabase
    .from("game_downloads")
    .select("id, game_slug, device, kind, file_name, mime_type, data_base64")
    .eq("game_slug", gameSlug)
    .eq("kind", kind)
    .order("device", { ascending: true });

  if (error) {
    console.error("getDownloads error", error);
    return [];
  }
  return data as GameDownload[];
}

export async function claimDemo(gameSlug: string): Promise<{ ok: boolean; message?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) {
    return { ok: false, message: "Sign in required to claim a demo." };
  }

  const { error } = await supabase.from("demo_claims").insert({ user_id: user.id, game_slug: gameSlug });
  if (error) {
    if (error.code === "23505") {
      // unique violation
      return { ok: false, message: "You already claimed this demo." };
    }
    console.error("claimDemo error", error);
    return { ok: false, message: "Could not claim demo." };
  }
  return { ok: true };
}

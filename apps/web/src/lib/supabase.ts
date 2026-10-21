import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** API mode is on only when the web app is pointed at a real API. */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || undefined;

let instance: SupabaseClient | null | undefined;

/** Supabase Auth client (e-mail OTP); `null` when the web app has no Supabase settings. Browser only. */
export function getSupabase(): SupabaseClient | null {
  if (instance !== undefined) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && anonKey ? createClient(url, anonKey) : null;
  return instance;
}

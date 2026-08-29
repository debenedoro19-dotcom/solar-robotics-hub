// Compatibility shim for the ported code, which called `createClient()` per
// component against an untyped Supabase client. On this stack there is a
// single generated browser client, so we hand that back with a loose type so
// the ported data shapes keep working.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedSupabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = typedSupabase as unknown as SupabaseClient<any, "public", any>;

export function createClient() {
  return client;
}

export { client as supabase };

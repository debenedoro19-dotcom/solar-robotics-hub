// Compatibility shim for the ported Next.js code, which called
// `createClient()` per component. On this stack there is a single generated
// browser client, so we simply hand that back.
import { supabase } from "@/integrations/supabase/client";

export function createClient() {
  return supabase;
}

export { supabase };

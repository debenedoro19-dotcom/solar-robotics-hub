import { createClient } from '@/lib/supabase/client';

/**
 * Server-verified admin check. Calls the `is_admin()` security-definer
 * function, which reads the `user_roles` table (roles are never stored on a
 * profile row or in localStorage, so this cannot be spoofed client-side).
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return false;
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

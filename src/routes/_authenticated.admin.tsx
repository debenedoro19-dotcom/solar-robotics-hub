import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    const { data, error } = await supabase.rpc("is_admin");
    if (error || data !== true) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});

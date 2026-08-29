// Small compatibility layer so the ported Next.js App Router code keeps its
// original call shape while running on TanStack Router.
import { useMemo } from "react";
import {
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";

export function useRouter() {
  const navigate = useNavigate();
  // Memoize so effects depending on `router` don't re-run every render.
  return useMemo(
    () => ({
      push: (href: string) => {
        if (href.startsWith("http")) {
          window.location.href = href;
          return;
        }
        void navigate({ to: href as never });
      },
      replace: (href: string) => {
        void navigate({ to: href as never, replace: true });
      },
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      prefetch: () => {},
      refresh: () => window.location.reload(),
    }),
    [navigate],
  );
}

export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams() {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return useMemo(
    () => ({
      get: (key: string) => {
        const value = search?.[key];
        return value === undefined || value === null ? null : String(value);
      },
      has: (key: string) => search?.[key] !== undefined,
      toString: () =>
        new URLSearchParams(
          Object.entries(search ?? {}).map(([k, v]) => [k, String(v)]),
        ).toString(),
    }),
    [search],
  );
}

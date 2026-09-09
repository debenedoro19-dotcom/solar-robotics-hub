import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-audit";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Admin · Audit Trail — Trade Tesla" },
      { name: "description", content: "Complete server-side audit trail of deposits, withdrawals and balance changes." },
      { property: "og:title", content: "Admin · Audit Trail — Trade Tesla" },
      { property: "og:description", content: "Complete server-side audit trail of deposits, withdrawals and balance changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

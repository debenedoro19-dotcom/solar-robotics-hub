import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-transactions";

export const Route = createFileRoute("/_authenticated/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Admin · Transactions — Trade Tesla" },
      { name: "description", content: "Review every ledger movement across the platform." },
      { property: "og:title", content: "Admin · Transactions — Trade Tesla" },
      { property: "og:description", content: "Review every ledger movement across the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

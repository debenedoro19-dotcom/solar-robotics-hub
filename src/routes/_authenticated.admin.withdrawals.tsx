import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-withdrawals";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  head: () => ({
    meta: [
      { title: "Admin · Withdrawals — Tesla Trade" },
      { name: "description", content: "Review and process withdrawal requests." },
      { property: "og:title", content: "Admin · Withdrawals — Tesla Trade" },
      { property: "og:description", content: "Review and process withdrawal requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

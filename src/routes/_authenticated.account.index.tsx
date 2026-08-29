import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "Account & Balance — Tesla Trade" },
      { name: "description", content: "Manage your balance, deposits and withdrawal requests." },
      { property: "og:title", content: "Account & Balance — Tesla Trade" },
      { property: "og:description", content: "Manage your balance, deposits and withdrawal requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

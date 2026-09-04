import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-users";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Admin · Users — Tesla Trade" },
      { name: "description", content: "Manage platform users, roles and portfolios." },
      { property: "og:title", content: "Admin · Users — Tesla Trade" },
      { property: "og:description", content: "Manage platform users, roles and portfolios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

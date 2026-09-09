import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin · Settings — Trade Tesla" },
      { name: "description", content: "Configure platform settings, payments and content." },
      { property: "og:title", content: "Admin · Settings — Trade Tesla" },
      { property: "og:description", content: "Configure platform settings, payments and content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

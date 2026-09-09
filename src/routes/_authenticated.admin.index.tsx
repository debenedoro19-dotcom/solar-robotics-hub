import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-overview";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Trade Tesla" },
      { name: "description", content: "Platform-wide admin overview and metrics." },
      { property: "og:title", content: "Admin Overview — Trade Tesla" },
      { property: "og:description", content: "Platform-wide admin overview and metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

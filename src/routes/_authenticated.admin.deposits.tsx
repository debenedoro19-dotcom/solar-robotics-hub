import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-deposits";

export const Route = createFileRoute("/_authenticated/admin/deposits")({
  head: () => ({
    meta: [
      { title: "Admin · Deposits — Trade Tesla" },
      { name: "description", content: "Review and confirm user deposit records." },
      { property: "og:title", content: "Admin · Deposits — Trade Tesla" },
      { property: "og:description", content: "Review and confirm user deposit records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

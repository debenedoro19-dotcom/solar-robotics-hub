import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/support";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support Center — Trade Tesla" },
      { name: "description", content: "Open a ticket and get help from the Trade Tesla support team." },
      { property: "og:title", content: "Support Center — Trade Tesla" },
      { property: "og:description", content: "Open a ticket and get help from the Trade Tesla support team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

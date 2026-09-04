import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/inventory";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Live Inventory — Tesla Trade" },
      { name: "description", content: "Browse verified Tesla vehicles, energy systems and robotics with live market pricing on Tesla Trade." },
      { property: "og:title", content: "Live Inventory — Tesla Trade" },
      { property: "og:description", content: "Browse verified Tesla vehicles, energy systems and robotics with live market pricing on Tesla Trade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

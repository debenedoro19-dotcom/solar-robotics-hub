import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/inventory";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Live Inventory — Trade Tesla" },
      { name: "description", content: "Browse verified Tesla vehicles, energy systems and robotics with live market pricing on Trade Tesla." },
      { property: "og:title", content: "Live Inventory — Trade Tesla" },
      { property: "og:description", content: "Browse verified Tesla vehicles, energy systems and robotics with live market pricing on Trade Tesla." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

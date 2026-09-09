import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/elon-musk";

export const Route = createFileRoute("/elon-musk")({
  head: () => ({
    meta: [
      { title: "Elon Musk — Trade Tesla" },
      { name: "description", content: "The vision behind Tesla, SpaceX, Neuralink and xAI — and what it means for Trade Tesla investors." },
      { property: "og:title", content: "Elon Musk — Trade Tesla" },
      { property: "og:description", content: "The vision behind Tesla, SpaceX, Neuralink and xAI — and what it means for Trade Tesla investors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

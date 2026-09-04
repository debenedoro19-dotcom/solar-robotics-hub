import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/elon-musk";

export const Route = createFileRoute("/elon-musk")({
  head: () => ({
    meta: [
      { title: "Elon Musk — Tesla Trade" },
      { name: "description", content: "The vision behind Tesla, SpaceX, Neuralink and xAI — and what it means for Tesla Trade investors." },
      { property: "og:title", content: "Elon Musk — Tesla Trade" },
      { property: "og:description", content: "The vision behind Tesla, SpaceX, Neuralink and xAI — and what it means for Tesla Trade investors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

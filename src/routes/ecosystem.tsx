import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ecosystem";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "The Ecosystem — Tesla Trade" },
      { name: "description", content: "Explore the Tesla ecosystem — vehicles, energy systems, robotics, SpaceX, Neuralink and xAI — one interconnected vision." },
      { property: "og:title", content: "The Ecosystem — Tesla Trade" },
      { property: "og:description", content: "Explore the Tesla ecosystem — vehicles, energy systems, robotics, SpaceX, Neuralink and xAI — one interconnected vision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/news";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Tesla Market News — Tesla Trade" },
      { name: "description", content: "Latest Tesla ecosystem news covering vehicles, energy, solar and robotics markets." },
      { property: "og:title", content: "Tesla Market News — Tesla Trade" },
      { property: "og:description", content: "Latest Tesla ecosystem news covering vehicles, energy, solar and robotics markets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

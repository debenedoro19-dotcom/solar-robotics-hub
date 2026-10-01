import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trade Tesla — Premium Tesla Ecosystem Marketplace" },
      {
        name: "description",
        content:
          "Invest in Tesla vehicles, energy, solar and robotics on a secure high-tech marketplace with live inventory and real-time returns.",
      },
      {
        property: "og:title",
        content: "Trade Tesla — Premium Tesla Ecosystem Marketplace",
      },
      {
        property: "og:description",
        content:
          "Invest in Tesla vehicles, energy, solar and robotics on a secure high-tech marketplace with live inventory and real-time returns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "image", href: "/assets/images/tesla_vehicles_hero.webp", fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

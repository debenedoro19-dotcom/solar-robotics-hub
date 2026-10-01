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
      { property: "og:image", content: "https://tradeenergyhub.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://tradeenergyhub.com/og-image.jpg" },
    ],
    links: [
      { rel: "preload", as: "image", href: "/assets/video/inventory-poster.jpg", fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

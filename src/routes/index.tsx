import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tesla Trade — Premium Tesla Ecosystem Marketplace" },
      {
        name: "description",
        content:
          "Invest in Tesla vehicles, energy, solar and robotics on a secure high-tech marketplace with live inventory and real-time returns.",
      },
      {
        property: "og:title",
        content: "Tesla Trade — Premium Tesla Ecosystem Marketplace",
      },
      {
        property: "og:description",
        content:
          "Invest in Tesla vehicles, energy, solar and robotics on a secure high-tech marketplace with live inventory and real-time returns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

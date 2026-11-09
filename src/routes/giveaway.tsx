import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/giveaways";

export const Route = createFileRoute("/giveaway")({
  head: () => ({
    meta: [
      { title: "Tesla Giveaways — Trade Tesla" },
      { name: "description", content: "Enter official Trade Tesla vehicle, technology and ecosystem giveaways." },
      { property: "og:title", content: "Tesla Giveaways — Trade Tesla" },
      { property: "og:description", content: "Enter official Trade Tesla vehicle, technology and ecosystem giveaways." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/giveaway" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/giveaway" }],
  }),
  component: Page,
});

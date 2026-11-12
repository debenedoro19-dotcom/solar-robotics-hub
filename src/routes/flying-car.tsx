import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flying-car";

export const Route = createFileRoute("/flying-car")({
  head: () => ({
    meta: [
      { title: "Model Aero Flying Car Pre-Book & Test Drive — Trade Tesla" },
      {
        name: "description",
        content:
          "Pre-book the dual-mode Tesla Model Aero eVTOL flying vehicle or schedule a prototype track test drive and flight briefing.",
      },
      { property: "og:title", content: "Model Aero Flying Car Pre-Book & Test Drive — Trade Tesla" },
      {
        property: "og:description",
        content:
          "Reserve your priority Model Aero build slot or book a prototype test drive at a regional Trade Tesla hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/flying-car" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/flying-car" }],
  }),
  component: Page,
});

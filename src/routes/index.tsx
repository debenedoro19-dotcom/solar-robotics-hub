import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tesla Trade — Premium Tesla Ecosystem Marketplace" },
      { name: "description", content: "Buy, sell and invest in Tesla vehicles, energy systems, solar and robotics on a secure, high-tech marketplace." },
      { property: "og:title", content: "Tesla Trade — Premium Tesla Ecosystem Marketplace" },
      { property: "og:description", content: "Buy, sell and invest in Tesla vehicles, energy systems, solar and robotics on a secure, high-tech marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

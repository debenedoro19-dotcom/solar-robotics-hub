import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/flying-car")({
  beforeLoad: () => {
    throw redirect({ to: "/inventory" });
  },
  head: () => ({
    meta: [
      { title: "Vehicle Inventory — Trade Tesla" },
      {
        name: "description",
        content: "Browse current vehicle and clean-energy inventory listings from Trade Tesla.",
      },
      { property: "og:title", content: "Vehicle Inventory — Trade Tesla" },
      {
        property: "og:description",
        content: "Browse current vehicle and clean-energy inventory listings from Trade Tesla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/inventory" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/inventory" }],
  }),
});

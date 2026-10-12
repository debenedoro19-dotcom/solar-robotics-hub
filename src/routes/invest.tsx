import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/invest";

export const Route = createFileRoute("/invest")({
  head: () => ({
    meta: [
      { title: "Investment Packages — Trade Tesla" },
      { name: "description", content: "Explore curated Tesla investment packages with transparent returns, live tracking and bank-grade security." },
      { property: "og:title", content: "Investment Packages — Trade Tesla" },
      { property: "og:description", content: "Explore curated Tesla investment packages with transparent returns, live tracking and bank-grade security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/invest" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/invest" }],
  }),
  component: Page,
});

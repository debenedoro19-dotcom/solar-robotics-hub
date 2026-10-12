import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/payments";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payment Methods — Trade Tesla" },
      { name: "description", content: "Accepted payment methods on Trade Tesla: bank wire transfer, cryptocurrency (USDT, BTC) and credit/debit cards, plus the platform portfolio snapshot." },
      { property: "og:title", content: "Payment Methods — Trade Tesla" },
      { property: "og:description", content: "Accepted payment methods on Trade Tesla: bank wire transfer, cryptocurrency (USDT, BTC) and credit/debit cards, plus the platform portfolio snapshot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/payments" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/payments" }],
  }),
  component: Page,
});

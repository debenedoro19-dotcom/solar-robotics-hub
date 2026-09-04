import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/payments";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payment Methods — Tesla Trade" },
      { name: "description", content: "Accepted payment methods on Tesla Trade: bank wire transfer, cryptocurrency (USDT, BTC) and credit/debit cards, plus the platform portfolio snapshot." },
      { property: "og:title", content: "Payment Methods — Tesla Trade" },
      { property: "og:description", content: "Accepted payment methods on Tesla Trade: bank wire transfer, cryptocurrency (USDT, BTC) and credit/debit cards, plus the platform portfolio snapshot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

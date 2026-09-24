import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account-orders";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Trade Tesla" },
      { name: "description", content: "Track your Trade Tesla inventory purchases from payment to delivery." },
      { property: "og:title", content: "My Orders — Trade Tesla" },
      { property: "og:description", content: "Track your Trade Tesla inventory purchases from payment to delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

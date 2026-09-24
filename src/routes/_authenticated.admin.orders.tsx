import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-orders";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "Admin · Orders — Trade Tesla" },
      { name: "description", content: "Confirm payments and manage inventory order fulfilment." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

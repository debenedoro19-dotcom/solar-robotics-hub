import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-giveaways";

export const Route = createFileRoute("/_authenticated/admin/giveaways")({
  head: () => ({
    meta: [
      { title: "Giveaway Management — Trade Tesla Admin" },
      { name: "description", content: "Create and manage wallet-funded giveaway campaigns." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account-deposit";

export const Route = createFileRoute("/_authenticated/account/deposit")({
  head: () => ({
    meta: [
      { title: "Make a Deposit — Trade Tesla" },
      { name: "description", content: "Fund your Trade Tesla account by bank transfer or crypto." },
      { property: "og:title", content: "Make a Deposit — Trade Tesla" },
      { property: "og:description", content: "Fund your Trade Tesla account by bank transfer or crypto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

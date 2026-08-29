import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account-deposit";

export const Route = createFileRoute("/_authenticated/account/deposit")({
  head: () => ({
    meta: [
      { title: "Make a Deposit — Tesla Trade" },
      { name: "description", content: "Fund your Tesla Trade account by bank transfer or crypto." },
      { property: "og:title", content: "Make a Deposit — Tesla Trade" },
      { property: "og:description", content: "Fund your Tesla Trade account by bank transfer or crypto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

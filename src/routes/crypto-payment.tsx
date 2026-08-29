import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/crypto-payment";

export const Route = createFileRoute("/crypto-payment")({
  head: () => ({
    meta: [
      { title: "Crypto Payment — Tesla Trade" },
      { name: "description", content: "Complete your deposit securely with cryptocurrency." },
      { property: "og:title", content: "Crypto Payment — Tesla Trade" },
      { property: "og:description", content: "Complete your deposit securely with cryptocurrency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/support";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support Center — Tesla Trade" },
      { name: "description", content: "Open a ticket and get help from the Tesla Trade support team." },
      { property: "og:title", content: "Support Center — Tesla Trade" },
      { property: "og:description", content: "Open a ticket and get help from the Tesla Trade support team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Tesla Trade" },
      { name: "description", content: "The terms governing your use of the Tesla Trade investment marketplace." },
      { property: "og:title", content: "Terms of Service — Tesla Trade" },
      { property: "og:description", content: "The terms governing your use of the Tesla Trade investment marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

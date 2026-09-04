import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Tesla Trade" },
      { name: "description", content: "How Tesla Trade collects, uses and protects your personal and financial data." },
      { property: "og:title", content: "Privacy Policy — Tesla Trade" },
      { property: "og:description", content: "How Tesla Trade collects, uses and protects your personal and financial data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

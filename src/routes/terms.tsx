import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Trade Tesla" },
      { name: "description", content: "The terms governing your use of the Trade Tesla investment marketplace." },
      { property: "og:title", content: "Terms of Service — Trade Tesla" },
      { property: "og:description", content: "The terms governing your use of the Trade Tesla investment marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

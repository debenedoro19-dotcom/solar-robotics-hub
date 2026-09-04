import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/verify-pending";

export const Route = createFileRoute("/verify-pending")({
  head: () => ({
    meta: [
      { title: "Verify Your Email — Trade Tesla" },
      { name: "description", content: "Confirm your email address to activate your Trade Tesla account." },
      { property: "og:title", content: "Verify Your Email — Trade Tesla" },
      { property: "og:description", content: "Confirm your email address to activate your Trade Tesla account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

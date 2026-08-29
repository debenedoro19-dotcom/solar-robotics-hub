import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/verify-pending";

export const Route = createFileRoute("/verify-pending")({
  head: () => ({
    meta: [
      { title: "Verify Your Email — Tesla Trade" },
      { name: "description", content: "Confirm your email address to activate your Tesla Trade account." },
      { property: "og:title", content: "Verify Your Email — Tesla Trade" },
      { property: "og:description", content: "Confirm your email address to activate your Tesla Trade account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

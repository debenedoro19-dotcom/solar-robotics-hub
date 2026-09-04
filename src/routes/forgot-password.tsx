import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/forgot-password";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Tesla Trade" },
      { name: "description", content: "Request a password reset link for your Tesla Trade account." },
      { property: "og:title", content: "Reset Password — Tesla Trade" },
      { property: "og:description", content: "Request a password reset link for your Tesla Trade account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

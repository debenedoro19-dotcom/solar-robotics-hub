import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/forgot-password";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Trade Tesla" },
      { name: "description", content: "Request a password reset link for your Trade Tesla account." },
      { property: "og:title", content: "Reset Password — Trade Tesla" },
      { property: "og:description", content: "Request a password reset link for your Trade Tesla account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

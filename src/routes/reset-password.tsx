import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reset-password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Trade Tesla" },
      { name: "description", content: "Choose a new password for your Trade Tesla account." },
      { property: "og:title", content: "Set New Password — Trade Tesla" },
      { property: "og:description", content: "Choose a new password for your Trade Tesla account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

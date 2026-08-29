import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reset-password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Tesla Trade" },
      { name: "description", content: "Choose a new password for your Tesla Trade account." },
      { property: "og:title", content: "Set New Password — Tesla Trade" },
      { property: "og:description", content: "Choose a new password for your Tesla Trade account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

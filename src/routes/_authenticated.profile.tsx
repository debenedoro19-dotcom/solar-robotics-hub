import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings — Trade Tesla" },
      { name: "description", content: "Update your profile, security and notification settings." },
      { property: "og:title", content: "Profile Settings — Trade Tesla" },
      { property: "og:description", content: "Update your profile, security and notification settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

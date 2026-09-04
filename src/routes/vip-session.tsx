import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/vip-session";

export const Route = createFileRoute("/vip-session")({
  head: () => ({
    meta: [
      { title: "VIP Private Session — Tesla Trade" },
      { name: "description", content: "Apply for a private 30-minute session to discuss investment opportunities across the Tesla ecosystem." },
      { property: "og:title", content: "VIP Private Session — Tesla Trade" },
      { property: "og:description", content: "Apply for a private 30-minute session to discuss investment opportunities across the Tesla ecosystem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

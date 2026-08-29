import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Tesla Trade" },
      { name: "description", content: "Track your Tesla portfolio, returns and activity in real time." },
      { property: "og:title", content: "Dashboard — Tesla Trade" },
      { property: "og:description", content: "Track your Tesla portfolio, returns and activity in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

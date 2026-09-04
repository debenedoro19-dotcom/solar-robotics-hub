import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — Tesla Trade" },
      { name: "description", content: "Create your Tesla Trade account and start investing in the Tesla ecosystem." },
      { property: "og:title", content: "Create Account — Tesla Trade" },
      { property: "og:description", content: "Create your Tesla Trade account and start investing in the Tesla ecosystem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

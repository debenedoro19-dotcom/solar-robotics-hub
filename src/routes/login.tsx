import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Trade Tesla" },
      { name: "description", content: "Sign in to your Trade Tesla account to manage investments, deposits and withdrawals." },
      { property: "og:title", content: "Sign In — Trade Tesla" },
      { property: "og:description", content: "Sign in to your Trade Tesla account to manage investments, deposits and withdrawals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

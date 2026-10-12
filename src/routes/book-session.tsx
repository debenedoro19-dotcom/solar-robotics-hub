import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/book-session";

export const Route = createFileRoute("/book-session")({
  head: () => ({
    meta: [
      { title: "Book a Strategy Session — Trade Tesla" },
      { name: "description", content: "Book a private virtual or in-person session with a Trade Tesla investment strategist." },
      { property: "og:title", content: "Book a Strategy Session — Trade Tesla" },
      { property: "og:description", content: "Book a private virtual or in-person session with a Trade Tesla investment strategist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://tradeenergyhub.com/book-session" },
    ],
    links: [{ rel: "canonical", href: "https://tradeenergyhub.com/book-session" }],
  }),
  component: Page,
});

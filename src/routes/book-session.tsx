import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/book-session";

export const Route = createFileRoute("/book-session")({
  head: () => ({
    meta: [
      { title: "Book a Strategy Session — Tesla Trade" },
      { name: "description", content: "Book a private virtual or in-person session with a Tesla Trade investment strategist." },
      { property: "og:title", content: "Book a Strategy Session — Tesla Trade" },
      { property: "og:description", content: "Book a private virtual or in-person session with a Tesla Trade investment strategist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

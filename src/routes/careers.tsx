import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/careers";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Trade Tesla" },
      { name: "description", content: "Join Trade Tesla: open roles across engineering, energy operations, robotics, finance and customer care." },
      { property: "og:title", content: "Careers — Trade Tesla" },
      { property: "og:description", content: "Join Trade Tesla: open roles across engineering, energy operations, robotics, finance and customer care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

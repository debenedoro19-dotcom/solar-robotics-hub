import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/career-detail";

export const Route = createFileRoute("/careers_/$slug")({
  head: () => ({
    meta: [
      { title: "Apply — Careers at Trade Tesla" },
      { name: "description", content: "Apply for an open role at Trade Tesla and help build the clean-energy future." },
      { property: "og:title", content: "Apply — Careers at Trade Tesla" },
      { property: "og:description", content: "Apply for an open role at Trade Tesla and help build the clean-energy future." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: function CareerDetailRoute() {
    const { slug } = Route.useParams();
    return <Page slug={slug} />;
  },
});

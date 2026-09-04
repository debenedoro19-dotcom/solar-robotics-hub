import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-plans";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({
    meta: [
      { title: "Investment Packages — Tesla Trade Admin" },
      { name: "description", content: "Create, edit, reorder and retire investment plans." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

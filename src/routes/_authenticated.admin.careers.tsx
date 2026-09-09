import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-careers";

export const Route = createFileRoute("/_authenticated/admin/careers")({
  head: () => ({
    meta: [
      { title: "Careers Pipeline — Trade Tesla Admin" },
      { name: "description", content: "Manage job postings and the applicant pipeline." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

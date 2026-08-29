import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-sessions";

export const Route = createFileRoute("/_authenticated/admin/sessions")({
  head: () => ({
    meta: [
      { title: "Session Bookings — Tesla Trade Admin" },
      { name: "description", content: "Review and edit advisory session bookings." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-inventory";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Editor — Trade Tesla Admin" },
      { name: "description", content: "Add, edit, reorder and recategorize homepage inventory listings." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/referral";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [
      { title: "Referrals — Trade Tesla" },
      { name: "description", content: "Invite investors and earn referral rewards." },
      { property: "og:title", content: "Referrals — Trade Tesla" },
      { property: "og:description", content: "Invite investors and earn referral rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

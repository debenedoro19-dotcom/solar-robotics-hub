import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/kyc";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Identity Verification — Trade Tesla" },
      { name: "description", content: "Complete KYC verification to unlock full platform access." },
      { property: "og:title", content: "Identity Verification — Trade Tesla" },
      { property: "og:description", content: "Complete KYC verification to unlock full platform access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

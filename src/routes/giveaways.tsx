import { createFileRoute } from "@tanstack/react-router";
import GiveawaysSection from "@/components/sections/GiveawaysSection";

export const Route = createFileRoute("/giveaways")({
  head: () => ({
    meta: [
      { title: "Giveaways — Trade Tesla" },
      {
        name: "description",
        content:
          "Enter Trade Tesla giveaways: win Tesla vehicles, Bitcoin and exclusive experiences. Entries are paid from your wallet balance.",
      },
      { property: "og:title", content: "Giveaways — Trade Tesla" },
      {
        property: "og:description",
        content:
          "Enter Trade Tesla giveaways: win Tesla vehicles, Bitcoin and exclusive experiences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiveawaysPage,
});

function GiveawaysPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <GiveawaysSection />
    </main>
  );
}

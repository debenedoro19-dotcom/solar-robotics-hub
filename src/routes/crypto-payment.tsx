import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/crypto-payment")({
  beforeLoad: () => {
    throw redirect({ to: "/account/deposit" });
  },
  component: () => null,
});


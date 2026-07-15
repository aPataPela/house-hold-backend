import type { Metadata } from "next";
import { ThemeIdentityVisualPage } from "@/features/theme-personalization/ui";

export const metadata: Metadata = {
  title: "Identidad visual | Casa Viva",
  description: "Selecciona un tema personal para tu cuenta sin alterar datos ni flujos.",
};

export default function IdentityVisualRoute() {
  return <ThemeIdentityVisualPage />;
}


import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/design-system/theme";
import { themeDefinitions } from "@/design-system/theme/theme-definitions";
import { ServiceWorkerRegister } from "./service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Household",
  description: "Organiza gastos, ausencias y tareas de una casa compartida.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shared Household",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: themeDefinitions.patagonia.semanticColors.backgroundPage,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider houseThemeId="patagonia">{children}</ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

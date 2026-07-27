import type { Metadata, Viewport } from "next";

import { CosmicBackground } from "@/components/CosmicBackground";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stuart Softball League '26",
  description:
    "Sign up for this week's Stuart Softball League game. Coed sandlot Tuesdays under the stars.",
};

export const viewport: Viewport = {
  themeColor: "#05050f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="font-display bg-void-950 text-starlight relative flex min-h-full flex-col">
        <CosmicBackground />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";

import { CosmicBackground } from "@/components/CosmicBackground";

import "./globals.css";

const SITE_URL = "https://ssl.t3kdesigns.app";
const DESCRIPTION =
  "Check in for this week's Stuart Softball League game. Coed sandlot Fridays at 7:30, under the lights.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Stuart Softball League '26",
  description: DESCRIPTION,
  applicationName: "Stuart Softball League '26",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Stuart Softball League '26",
    title: "Stuart Softball League '26",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Stuart Softball League '26 — coed sandlot Fridays at 7:30 PM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stuart Softball League '26",
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
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

import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stuart Softball League '26",
  description:
    "Sign up for this week's Stuart Softball League game. Adult coed softball, Tuesday nights.",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
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
      <body className="font-display flex min-h-full flex-col">{children}</body>
    </html>
  );
}

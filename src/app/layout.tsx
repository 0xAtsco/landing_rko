import type { Metadata } from "next";
import { Geologica, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { siteMetadata } from "@/lib/content";
import "./globals.css";

const geologica = Geologica({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-geologica",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecamp.ai"),
  title: siteMetadata.title,
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    type: "website",
    images: [
      {
        url: "/generated/og-vibecamp-rko.png",
        width: 1200,
        height: 630,
        alt: "VibeCamp — AI-воронка под РКО, Telegram и заявки за 14 дней",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.shortDescription,
    images: ["/generated/og-vibecamp-rko.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`h-full antialiased ${geologica.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full overflow-x-hidden bg-[#020817]">{children}</body>
    </html>
  );
}

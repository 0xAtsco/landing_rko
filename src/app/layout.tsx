import type { Metadata } from "next";
import { siteMetadata } from "@/lib/content";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full overflow-x-hidden bg-[#020817]">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCamp — собери свою AI-связку за 14 дней",
  description:
    "Практический интенсив по вайбкодингу: лендинг, Telegram-бот, CRM, автоконтент, обработка лидов или AI-агент — с кураторами и записями навсегда.",
  openGraph: {
    title: "VibeCamp — собери свою AI-связку за 14 дней",
    description:
      "Практический интенсив по вайбкодингу: лендинг, Telegram-бот, CRM, автоконтент, обработка лидов или AI-агент — с кураторами и записями навсегда.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCamp — собери свою AI-связку за 14 дней",
    description:
      "Практический интенсив по вайбкодингу: лендинг, Telegram-бот, CRM, автоконтент, обработка лидов или AI-агент.",
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

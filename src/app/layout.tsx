import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCamp — собери рабочую воронку за 14 дней",
  description:
    "Практический спринт: лендинг, Telegram-бот, CRM, контент-система или обработка РКО-заявок под твой оффер, трафик и клиентов.",
  openGraph: {
    title: "VibeCamp — собери рабочую воронку за 14 дней",
    description:
      "Практический спринт: лендинг, Telegram-бот, CRM, контент-система или обработка РКО-заявок под твой оффер, трафик и клиентов.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCamp — собери рабочую воронку за 14 дней",
    description:
      "Практический спринт: лендинг, Telegram-бот, CRM, контент-система или обработка РКО-заявок.",
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

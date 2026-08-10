import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./repair-demo.css";

export const metadata: Metadata = {
  title: "Ремонт квартир под ключ в Москве и МО",
  description:
    "Страница для подбора параметров ремонта и связи в Telegram.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Ремонт квартир под ключ",
    description: "Подберите параметры ремонта и напишите в Telegram.",
    type: "website",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Ремонт квартир под ключ",
    description: "Подберите параметры ремонта и напишите в Telegram.",
    images: [],
  },
};

export default function RepairMoscowDemoLayout({ children }: { children: ReactNode }) {
  return children;
}

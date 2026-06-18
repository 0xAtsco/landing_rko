import type { Metadata } from "next";
import { VcCommandCenterPage } from "@/components/demo/vc-command/VcCommandCenterPage";
import { isVcCommandTabId, isVcShowcaseMode, showcaseTabMap } from "@/components/demo/vc-command/vc-command-content";

export const metadata: Metadata = {
  title: "VC Command Center — AI Dialog Engine",
  description: "Демо AI-обработчика: тон, следующий вопрос, score, CRM, voice reply и качество источников.",
  openGraph: {
    title: "VC Command Center — AI Dialog Engine",
    description: "Синтетическое демо AI-связки: тон, score, CRM, выжимка и радар источников.",
    images: [
      {
        url: "/generated/vc-command-og.png",
        width: 1200,
        height: 630,
        alt: "VC Command Center demo showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VC Command Center — AI Dialog Engine",
    description: "Синтетическое демо AI-обработчика лидов.",
    images: ["/generated/vc-command-og.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

type VcCommandPageProps = {
  searchParams: Promise<{
    presenter?: string;
    showcase?: string;
    tab?: string;
  }>;
};

export default async function VcCommandPage({ searchParams }: VcCommandPageProps) {
  const params = await searchParams;
  const showcaseMode = isVcShowcaseMode(params.showcase) ? params.showcase : null;
  const initialTab = showcaseMode ? showcaseTabMap[showcaseMode] : isVcCommandTabId(params.tab) ? params.tab : "chats";

  return (
    <VcCommandCenterPage
      initialPresenterOpen={params.presenter === "1"}
      initialTab={initialTab}
      showcaseMode={showcaseMode}
    />
  );
}

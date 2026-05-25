import type { Metadata } from "next";
import {
  BusinessLandingMockup,
  CustomCrmMockup,
  HeroCommandCenterMockup,
  OgVibecampMockup,
  RkoPipelineMockup,
  SalesAgentsMockup,
  ShortsFactoryMockup,
  TelegramFunnelMockup,
} from "@/components/asset-studio/mockups";

export const metadata: Metadata = {
  title: "VibeCamp Asset Studio",
  robots: {
    index: false,
    follow: false,
  },
};

const assets = {
  hero: <HeroCommandCenterMockup />,
  "telegram-funnel": <TelegramFunnelMockup />,
  "rko-pipeline": <RkoPipelineMockup />,
  "sales-agents": <SalesAgentsMockup />,
  "shorts-factory": <ShortsFactoryMockup />,
  "custom-crm": <CustomCrmMockup />,
  "business-landing": <BusinessLandingMockup />,
  og: <OgVibecampMockup />,
} as const;

type AssetKey = keyof typeof assets;

type AssetStudioPageProps = {
  searchParams: Promise<{
    asset?: string;
  }>;
};

export default async function AssetStudioPage({ searchParams }: AssetStudioPageProps) {
  const params = await searchParams;
  const asset = params.asset && params.asset in assets ? (params.asset as AssetKey) : "hero";

  return (
    <div className="min-h-screen overflow-auto bg-[#020817]">
      {assets[asset]}
    </div>
  );
}

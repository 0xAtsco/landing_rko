import { BentoBuilds } from "@/components/landing/BentoBuilds";
import { Cases } from "@/components/landing/Cases";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { DemandProof } from "@/components/landing/DemandProof";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ForWhom } from "@/components/landing/ForWhom";
import { Format } from "@/components/landing/Format";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { SignalDivider } from "@/components/landing/SignalDivider";
import { Timeline } from "@/components/landing/Timeline";
import { WhyNow } from "@/components/landing/WhyNow";

export default function Home() {
  return (
    <main className="lab-shell min-h-screen overflow-x-clip bg-[#020817] text-white">
      <CursorGlow />
      <Header />
      <Hero />
      <SignalDivider />
      <DemandProof />
      <SignalDivider flip />
      <BentoBuilds />
      <Cases />
      <SignalDivider />
      <WhyNow />
      <Timeline />
      <Format />
      <ForWhom />
      <SignalDivider flip />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

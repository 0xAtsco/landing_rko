import { BentoBuilds } from "@/components/landing/BentoBuilds";
import { AfterApply } from "@/components/landing/AfterApply";
import { Cases } from "@/components/landing/Cases";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { DemandProof } from "@/components/landing/DemandProof";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ForWhom } from "@/components/landing/ForWhom";
import { Format } from "@/components/landing/Format";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { MotionBudgetController } from "@/components/landing/MotionBudgetController";
import { Pricing } from "@/components/landing/Pricing";
import { SignalDivider } from "@/components/landing/SignalDivider";
import { TeamBuild } from "@/components/landing/TeamBuild";
import { Timeline } from "@/components/landing/Timeline";
import { Tracks } from "@/components/landing/Tracks";
import { WhyNow } from "@/components/landing/WhyNow";

export default function Home() {
  return (
    <main className="lab-shell min-h-screen overflow-x-clip bg-[#020817] text-white">
      <MotionBudgetController />
      <CursorGlow />
      <Header />
      <Hero />
      <SignalDivider />
      <DemandProof />
      <TeamBuild />
      <SignalDivider flip />
      <BentoBuilds />
      <Tracks />
      <Cases />
      <SignalDivider />
      <WhyNow />
      <Timeline />
      <Format />
      <ForWhom />
      <SignalDivider flip />
      <AfterApply />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

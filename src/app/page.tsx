import { WhatIsVibecoding } from "@/components/landing/BentoBuilds";
import { StudentCases } from "@/components/landing/Cases";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { DemandProof } from "@/components/landing/DemandProof";
import { FastBuilds } from "@/components/landing/FastBuilds";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Outcomes } from "@/components/landing/Format";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { MotionBudgetController } from "@/components/landing/MotionBudgetController";
import { Pricing } from "@/components/landing/Pricing";
import { TrafficBenefit } from "@/components/landing/TrafficBenefit";
import { VibeVideoReveal } from "@/components/landing/VibeVideoReveal";

export default function Home() {
  return (
    <main className="lab-shell min-h-screen overflow-x-clip bg-[var(--surface-base)] text-white">
      <MotionBudgetController />
      <CursorGlow />
      <Header />
      <Hero />
      <WhatIsVibecoding />
      <VibeVideoReveal />
      <TrafficBenefit />
      <DemandProof />
      <FastBuilds />
      <StudentCases />
      <Outcomes />
      <Pricing />
      <FinalCTA />
    </main>
  );
}

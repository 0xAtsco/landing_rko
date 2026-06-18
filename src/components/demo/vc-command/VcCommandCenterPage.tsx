"use client";

import { useCallback, useState } from "react";
import { VcCommandPanels } from "./VcCommandPanels";
import { VcCommandShell } from "./VcCommandShell";
import { VcDemoScriptPanel } from "./VcDemoScriptPanel";
import { VcPresenterMode } from "./VcPresenterMode";
import { useVcDemoScenarios } from "./useVcDemoScenarios";
import type { VcCommandTabId, VcShowcaseMode } from "./vc-command-content";

type VcCommandCenterPageProps = {
  initialPresenterOpen: boolean;
  initialTab: VcCommandTabId;
  showcaseMode: VcShowcaseMode | null;
};

export function VcCommandCenterPage({
  initialPresenterOpen,
  initialTab,
  showcaseMode,
}: VcCommandCenterPageProps) {
  const [activeTab, setActiveTab] = useState<VcCommandTabId>(initialTab);
  const [presenterOpen, setPresenterOpen] = useState(initialPresenterOpen);
  const [presenterStepIndex, setPresenterStepIndex] = useState(0);
  const [scriptOpen, setScriptOpen] = useState(false);
  const scenarios = useVcDemoScenarios();

  const handleTabChange = useCallback((tab: VcCommandTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "chats") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <>
      <VcCommandShell
        activeTab={activeTab}
        onPresenterOpen={() => setPresenterOpen(true)}
        onScriptOpen={() => setScriptOpen(true)}
        onTabChange={handleTabChange}
        showcaseMode={showcaseMode}
      >
        <VcCommandPanels
          activeTab={activeTab}
          onPresenterOpen={() => setPresenterOpen(true)}
          onScriptOpen={() => setScriptOpen(true)}
          onTabChange={handleTabChange}
          scenarios={scenarios}
        />
      </VcCommandShell>

      <VcPresenterMode
        open={presenterOpen}
        scenarios={scenarios}
        stepIndex={presenterStepIndex}
        onClose={() => setPresenterOpen(false)}
        onStepChange={setPresenterStepIndex}
        onTabChange={handleTabChange}
      />
      <VcDemoScriptPanel open={scriptOpen} onClose={() => setScriptOpen(false)} />
    </>
  );
}

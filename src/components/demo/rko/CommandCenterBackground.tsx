export function CommandCenterBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--surface-base)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgb(var(--signal-rgb)/0.24),transparent_28rem),radial-gradient(circle_at_82%_10%,rgb(var(--signal-rgb)/0.22),transparent_26rem),radial-gradient(circle_at_48%_72%,rgb(8_47_73/0.30),transparent_34rem),linear-gradient(180deg,var(--surface-base)_0%,var(--surface-1)_52%,var(--surface-base)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--signal-rgb)/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--signal-rgb)/0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-50 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-signal-strong/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--surface-base)] to-transparent" />
    </div>
  );
}

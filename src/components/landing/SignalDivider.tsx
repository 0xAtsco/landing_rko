export function SignalDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-20 max-w-6xl overflow-hidden px-4 sm:px-6 ${flip ? "-scale-y-100" : ""}`}
    >
      <div className="absolute left-1/2 top-8 h-px w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 bg-gradient-to-r from-transparent via-signal/35 to-transparent" />
      <div className="absolute left-[12%] top-6 h-8 w-px rotate-[28deg] bg-signal/30" />
      <div className="absolute left-[27%] top-9 h-5 w-px rotate-[28deg] bg-signal/20" />
      <div className="absolute right-[18%] top-7 h-10 w-px rotate-[28deg] bg-signal/25" />
      <div className="absolute left-1/2 top-3 h-16 w-56 -translate-x-1/2 rounded-full bg-signal-strong/10 blur-2xl" />
    </div>
  );
}

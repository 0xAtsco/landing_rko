import Link from "next/link";
import { Activity, Bot, Gauge, RadioTower, Users } from "lucide-react";
import { CommandCenterBackground } from "./CommandCenterBackground";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/demo/rko", label: "Заявка", icon: Bot, analytics: "demo_start_chat" },
  { href: "/demo/rko/chat", label: "Chat", icon: RadioTower, analytics: "demo_start_chat" },
  { href: "/demo/rko/dashboard", label: "Dashboard", icon: Gauge, analytics: "demo_open_dashboard" },
  { href: "/demo/rko/traffic", label: "Traffic", icon: Activity, analytics: "demo_open_traffic" },
  { href: "/demo/rko/playground", label: "Playground", icon: Users, analytics: "demo_start_chat" },
];

export function RkoShell({ children, title, kicker, className }: { children: React.ReactNode; title?: string; kicker?: string; className?: string }) {
  return (
    <main className={cn("relative min-h-screen overflow-x-clip px-4 py-4 text-white sm:px-6 lg:px-8", className)}>
      <CommandCenterBackground />
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/demo/rko" className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal/80">VibeCamp demo</p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal text-white sm:text-2xl">RKO Lead Command Center</h1>
        </Link>
        <nav className="flex max-w-full gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.055] p-1 backdrop-blur-xl">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-analytics={item.analytics}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-slate-200 transition hover:bg-signal/10 hover:text-white"
              >
                <Icon className="size-4 text-signal" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {(title || kicker) && (
        <section className="mx-auto mt-8 w-full max-w-7xl">
          {kicker ? <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal/75">{kicker}</p> : null}
          {title ? <h2 className="mt-2 max-w-4xl text-balance text-3xl font-semibold leading-tight text-white sm:text-5xl">{title}</h2> : null}
        </section>
      )}
      <div className="mx-auto w-full max-w-7xl pb-12">{children}</div>
    </main>
  );
}

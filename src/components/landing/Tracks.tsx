import { ArrowRight, BriefcaseBusiness, RadioTower, WalletCards } from "lucide-react";
import { tracks } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

const icons = [WalletCards, RadioTower, BriefcaseBusiness];

export function Tracks() {
  return (
    <SectionReveal className="relative px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-violet-200/80">
              3 трека
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
              Можно идти по одному из треков
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            На старте выбираешь один путь и не распыляешься: один оффер, один процесс, один рабочий результат.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {tracks.map((track, index) => {
            const Icon = icons[index];

            return (
              <article
                key={track.title}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5 transition motion-safe:hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-cyan-200/[0.055] md:backdrop-blur-md"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
                </div>
                <h3 className="text-xl font-semibold text-white">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{track.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}

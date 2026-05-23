import { Gauge, HandCoins, SlidersHorizontal } from "lucide-react";
import { whyNowCards } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

const icons = [Gauge, SlidersHorizontal, HandCoins];

export function WhyNow() {
  return (
    <SectionReveal className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute right-[-12rem] top-[-10rem] size-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="max-w-4xl">
          <h2 className="text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
            Пока одни смотрят ролики про AI, другие уже собирают инструменты под
            клиентов и свои процессы
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Вайбкодинг — это не про то, чтобы стать программистом. Это про то,
            чтобы научиться объяснять задачу AI, проверять результат, править
            ошибки и доводить до работающей ссылки.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {whyNowCards.map((card, index) => {
            const Icon = icons[index];
            return (
              <article key={card.title} className="relative overflow-hidden rounded-lg border border-white/10 bg-[#06172e]/70 p-5">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
                <Icon className="mb-5 size-6 text-cyan-200" />
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}

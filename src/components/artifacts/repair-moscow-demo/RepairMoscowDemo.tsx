import Image from "next/image";
import {
  Hammer,
  House,
  PaintRoller,
  PencilRuler,
  Send,
  type LucideIcon,
} from "lucide-react";
import { repairMoscowDemoContent } from "@/lib/content";
import { RepairDemoInteractive } from "./RepairDemoInteractive";

type RepairMoscowDemoProps = {
  telegramUsername: string | null;
};

const statIcons: Record<string, LucideIcon> = {
  message: Send,
  clipboard: PencilRuler,
  workflow: Hammer,
};

const serviceIcons: Record<string, LucideIcon> = {
  paint: PaintRoller,
  hammer: Hammer,
  design: PencilRuler,
};

export function RepairMoscowDemo({ telegramUsername }: RepairMoscowDemoProps) {
  const content = repairMoscowDemoContent;

  return (
    <main className="repair-demo">
      <div className="repair-demo__page">
        <header className="repair-demo__header" aria-label="Шапка страницы">
          <a className="repair-demo__brand" href="#top" aria-label="К началу страницы">
            <span className="repair-demo__brand-mark" aria-hidden="true">
              <House size={26} strokeWidth={2.4} />
            </span>
            <span>
              <b>{content.brand.name}</b>
              <small>{content.brand.tagline}</small>
            </span>
          </a>
          <a className="repair-demo__button repair-demo__button--telegram" href="#lead-form">
            <Send size={18} aria-hidden="true" />
            Написать в Telegram
          </a>
        </header>

        <section className="repair-demo__hero" id="top" aria-labelledby="repair-demo-title">
          <div className="repair-demo__hero-copy">
            <p className="repair-demo__eyebrow">Москва и Московская область</p>
            <h1 id="repair-demo-title">{content.hero.title}</h1>
            <p className="repair-demo__hero-subtitle">{content.hero.subtitle}</p>
            <div className="repair-demo__hero-actions">
              <a className="repair-demo__button repair-demo__button--primary" href="#calculator">
                {content.hero.primaryCta}
              </a>
              <a className="repair-demo__button repair-demo__button--secondary" href="#portfolio">
                {content.hero.secondaryCta}
              </a>
            </div>
          </div>
          <div className="repair-demo__hero-image">
            <Image
              src={content.hero.image}
              alt={content.hero.imageAlt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 46vw"
            />
          </div>
        </section>

        <section className="repair-demo__stats" aria-label="Как устроено обращение">
          {content.stats.map((stat) => {
            const Icon = statIcons[stat.icon] ?? Send;
            return (
              <div className="repair-demo__stat" key={stat.value}>
                <Icon aria-hidden="true" />
                <span>
                  <b>{stat.value}</b>
                  <small>{stat.label}</small>
                </span>
              </div>
            );
          })}
        </section>

        <section className="repair-demo__section" aria-labelledby="services-title">
          <div className="repair-demo__section-heading">
            <p>Что можно собрать под задачу</p>
            <h2 id="services-title">Виды ремонта</h2>
          </div>
          <div className="repair-demo__service-grid">
            {content.services.map((service) => {
              const Icon = serviceIcons[service.icon] ?? Hammer;
              return (
                <article className="repair-demo__service-card" key={service.id}>
                  <span className={`repair-demo__service-icon repair-demo__service-icon--${service.id}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="repair-demo__section" id="portfolio" aria-labelledby="portfolio-title">
          <div className="repair-demo__section-heading">
            <p>Визуальный ориентир</p>
            <h2 id="portfolio-title">Варианты интерьера</h2>
          </div>
          <div className="repair-demo__work-grid">
            {content.works.map((work) => (
              <article className="repair-demo__work-card" key={work.title}>
                <div className="repair-demo__work-image">
                  <Image src={work.image} alt={work.alt} fill sizes="(max-width: 760px) 100vw, 33vw" />
                </div>
                <div className="repair-demo__work-copy">
                  <h3>{work.title}</h3>
                  <p>{work.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <RepairDemoInteractive telegramUsername={telegramUsername} />
      </div>
    </main>
  );
}

import type { PropsWithChildren } from "react";

type SectionRevealProps = PropsWithChildren<{
  className?: string;
  id?: string;
}>;

export function SectionReveal({ children, className, id }: SectionRevealProps) {
  return (
    <section
      id={id}
      className={`perf-section ${id ? "scroll-mt-24 sm:scroll-mt-28 " : ""}${className ?? ""}`}
    >
      {children}
    </section>
  );
}

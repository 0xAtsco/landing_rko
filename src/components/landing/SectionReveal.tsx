import type { PropsWithChildren } from "react";

type SectionRevealProps = PropsWithChildren<{
  className?: string;
  id?: string;
}>;

export function SectionReveal({ children, className, id }: SectionRevealProps) {
  return (
    <section
      id={id}
      className={`${id ? "scroll-mt-24 sm:scroll-mt-28 " : ""}[content-visibility:auto] [contain-intrinsic-size:1px_900px] ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

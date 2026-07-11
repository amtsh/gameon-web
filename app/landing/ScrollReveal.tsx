"use client";

import clsx from "clsx";
import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type Props = {
  as?: ElementType;
  className?: string;
  delayMs?: number;
  children: ReactNode;
} & Record<string, unknown>;

/** Fades content up once it enters the viewport. Rendering is not gated on
    JS: without it the element simply stays in its revealed state. */
export function ScrollReveal({
  as = "div",
  className,
  delayMs = 0,
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: clsx("lp-reveal", visible && "is-visible", className),
      style: delayMs ? { transitionDelay: `${delayMs}ms` } : undefined,
    },
    children,
  );
}

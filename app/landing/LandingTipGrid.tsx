import type { LandingShowcaseItem } from "./landing-showcase";

type Props = {
  tips: LandingShowcaseItem[];
};

export function LandingTipGrid({ tips }: Props) {
  return (
    <div className="lp-showcase-grid lp-showcase-grid--3">
      {tips.map((tip) => {
        const Icon = tip.icon;
        return (
          <article className="lp-showcase-card" key={tip.title}>
            <Icon
              aria-hidden
              className={`lp-showcase-icon lp-showcase-icon--${tip.iconVariant}`}
              size={40}
              strokeWidth={2}
            />
            <h3>{tip.title}</h3>
            <p>{tip.body}</p>
          </article>
        );
      })}
    </div>
  );
}

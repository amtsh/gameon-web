/**
 * Pure CSS animated background — no JS runtime cost.
 * Three radial-gradient orbs animate via @property (GPU-composited),
 * all behind a frosted-glass panel so the hero content stays crisp.
 */
export function HeroBackground() {
  return (
    <div className="lp-hero-bg" aria-hidden="true">
      <div className="lp-hero-bg-orb lp-hero-bg-orb--a" />
      <div className="lp-hero-bg-orb lp-hero-bg-orb--b" />
      <div className="lp-hero-bg-orb lp-hero-bg-orb--c" />
    </div>
  );
}

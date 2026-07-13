/**
 * Pure CSS animated background — no JS runtime cost.
 * Three radial-gradient orbs animate on the GPU; a light grain
 * overlay adds texture without dulling the color.
 */
export function HeroBackground() {
  return (
    <div className="lp-hero-bg" aria-hidden="true">
      <div className="lp-hero-bg-orbs">
        <div className="lp-hero-bg-orb lp-hero-bg-orb--a" />
        <div className="lp-hero-bg-orb lp-hero-bg-orb--b" />
        <div className="lp-hero-bg-orb lp-hero-bg-orb--c" />
      </div>
      <div className="lp-hero-bg-veil" />
      <div className="lp-hero-bg-grain" />
    </div>
  );
}

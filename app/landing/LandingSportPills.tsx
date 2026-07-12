import { sports } from "../data/mock-data";

/** Repeat within each group so wide viewports always have pills in frame. */
const groupSports = [...sports, ...sports, ...sports];

function SportPillGroup() {
  return (
    <div className="lp-sports-group">
      {groupSports.map((sport, index) => (
        <span className="lp-sport-pill" key={`${sport.id}-${index}`}>
          {sport.label}
        </span>
      ))}
    </div>
  );
}

export function LandingSportPills() {
  return (
    <div aria-hidden className="lp-sports-marquee">
      <div className="lp-sports-track">
        <SportPillGroup />
        <SportPillGroup />
      </div>
    </div>
  );
}

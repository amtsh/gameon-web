import { describe, expect, it } from "vitest";
import { formatGamesHosted, formatGamesPlayed } from "./game-count-copy";

describe("formatGamesHosted", () => {
  it("singularizes one game", () => {
    expect(formatGamesHosted(1)).toBe("1 game hosted");
  });

  it("pluralizes multiple games", () => {
    expect(formatGamesHosted(2)).toBe("2 games hosted");
  });
});

describe("formatGamesPlayed", () => {
  it("singularizes one game", () => {
    expect(formatGamesPlayed(1)).toBe("1 game played");
  });

  it("pluralizes multiple games", () => {
    expect(formatGamesPlayed(0)).toBe("0 games played");
  });
});

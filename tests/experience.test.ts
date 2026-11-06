import { describe, expect, it } from "vitest";
import {
  assignVariant,
  conversionRate,
  cwvPass,
  formatPercent,
  hasSrm,
  isSignificant,
  pooledRate,
  releaseGate,
  srmChiSquare,
  uplift,
  zScore,
  type CwvRoute,
  type Experiment,
  type VariantStats,
} from "../lib/experience";

function v(exposures: number, conversions: number, name = "Variant"): VariantStats {
  return { name, exposures, conversions };
}

function exp(control: VariantStats, variant: VariantStats): Experiment {
  return { id: "test", name: "Test", control, variant };
}

const passRoute: CwvRoute = { route: "Home", lcpMs: 2200, inpMs: 150, cls: 0.05, ttfbMs: 600 };
const failRoute: CwvRoute = { route: "Work", lcpMs: 3100, inpMs: 150, cls: 0.05, ttfbMs: 600 };

describe("Gladeye experience lab", () => {
  it("calculates conversion rate", () => {
    expect(conversionRate(v(1000, 50))).toBeCloseTo(0.05);
  });

  it("returns zero for empty exposures", () => {
    expect(conversionRate(v(0, 0))).toBe(0);
  });

  it("calculates relative uplift", () => {
    expect(uplift(v(10000, 500), v(10000, 600))).toBeCloseTo(0.2);
  });

  it("returns null uplift when control has no conversion", () => {
    expect(uplift(v(1000, 0), v(1000, 50))).toBeNull();
  });

  it("calculates pooled rate", () => {
    expect(pooledRate(v(1000, 50), v(1000, 70))).toBeCloseTo(0.06);
  });

  it("computes a positive z-score for an improving variant", () => {
    expect(zScore(v(10000, 500), v(10000, 600))).toBeGreaterThan(3);
  });

  it("computes a negative z-score for a worse variant", () => {
    expect(zScore(v(10000, 600), v(10000, 500))).toBeLessThan(-3);
  });

  it("marks a large lift significant", () => {
    expect(isSignificant(v(10000, 500), v(10000, 600))).toBe(true);
  });

  it("marks a tiny lift not significant", () => {
    expect(isSignificant(v(10000, 500), v(10000, 505))).toBe(false);
  });

  it("returns zero z-score for empty samples", () => {
    expect(zScore(v(0, 0), v(0, 0))).toBe(0);
  });

  it("detects a balanced split", () => {
    expect(srmChiSquare(v(10000, 500), v(10000, 500))).toBe(0);
    expect(hasSrm(v(10000, 500), v(10000, 500))).toBe(false);
  });

  it("detects sample ratio mismatch", () => {
    expect(srmChiSquare(v(12000, 600), v(8000, 400))).toBeGreaterThan(3.84);
    expect(hasSrm(v(12000, 600), v(8000, 400))).toBe(true);
  });

  it("passes a route within all CWV thresholds", () => {
    expect(cwvPass(passRoute)).toBe(true);
  });

  it("fails a route above the LCP threshold", () => {
    expect(cwvPass(failRoute)).toBe(false);
  });

  it("fails a route above the INP threshold", () => {
    expect(cwvPass({ ...passRoute, inpMs: 250 })).toBe(false);
  });

  it("fails a route above the CLS threshold", () => {
    expect(cwvPass({ ...passRoute, cls: 0.2 })).toBe(false);
  });

  it("fails a route above the TTFB threshold", () => {
    expect(cwvPass({ ...passRoute, ttfbMs: 900 })).toBe(false);
  });

  it("ships a positive significant variant with passing CWV", () => {
    const gate = releaseGate(exp(v(10000, 500), v(10000, 600)), [passRoute]);
    expect(gate.status).toBe("ship");
    expect(gate.significant).toBe(true);
    expect(gate.srm).toBe(false);
  });

  it("holds a non-significant experiment", () => {
    const gate = releaseGate(exp(v(10000, 500), v(10000, 505)), [passRoute]);
    expect(gate.status).toBe("hold");
  });

  it("fixes a significant negative variant", () => {
    const gate = releaseGate(exp(v(10000, 600), v(10000, 500)), [passRoute]);
    expect(gate.status).toBe("fix");
    expect(gate.reasons.join(" ")).toMatch(/underperforms/);
  });

  it("fixes a release with a failing CWV route", () => {
    const gate = releaseGate(exp(v(10000, 500), v(10000, 600)), [passRoute, failRoute]);
    expect(gate.status).toBe("fix");
    expect(gate.cwvPass).toBe(false);
  });

  it("fixes a release with sample ratio mismatch", () => {
    const gate = releaseGate(exp(v(12000, 600), v(8000, 400)), [passRoute]);
    expect(gate.status).toBe("fix");
    expect(gate.reasons.join(" ")).toMatch(/sample ratio/);
  });

  it("assigns a visitor deterministically", () => {
    const first = assignVariant("visitor-1042", "hero-motion");
    expect(assignVariant("visitor-1042", "hero-motion")).toBe(first);
    expect(["A", "B"]).toContain(first);
  });

  it("assigns different visitors across both variants", () => {
    const buckets = new Set(Array.from({ length: 1000 }, (_, index) => assignVariant(`visitor-${index}`, "hero-motion")));
    expect(buckets).toEqual(new Set(["A", "B"]));
  });

  it("formats percentages and null uplift", () => {
    expect(formatPercent(0.126)).toBe("12.60%");
    expect(formatPercent(null)).toBe("n/a");
  });

  it("exposes a release gate decision for every seeded experiment", () => {
    const experiments: Experiment[] = [
      exp(v(12400, 620), v(12550, 705)),
      exp(v(8200, 410), v(8150, 410)),
      exp(v(6400, 310), v(6450, 335)),
    ];
    expect(experiments.map((item) => releaseGate(item, [passRoute]).status)).toEqual(["ship", "hold", "hold"]);
  });
});

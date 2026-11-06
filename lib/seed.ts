import type { CwvRoute, Experiment } from "./experience";

export const experiments: Experiment[] = [
  {
    id: "hero-motion",
    name: "Homepage hero: motion vs static",
    control: { name: "Static", exposures: 12_400, conversions: 620 },
    variant: { name: "Motion", exposures: 12_550, conversions: 705 },
  },
  {
    id: "pdp-proof",
    name: "Case study: proof placement",
    control: { name: "Current", exposures: 8_200, conversions: 410 },
    variant: { name: "Inline proof", exposures: 8_150, conversions: 410 },
  },
  {
    id: "work-preview",
    name: "Work index: hover preview",
    control: { name: "Static grid", exposures: 6_400, conversions: 310 },
    variant: { name: "Hover preview", exposures: 6_450, conversions: 335 },
  },
];

export const routes: CwvRoute[] = [
  { route: "Home", lcpMs: 2_180, inpMs: 142, cls: 0.05, ttfbMs: 610 },
  { route: "Work index", lcpMs: 3_080, inpMs: 176, cls: 0.08, ttfbMs: 720 },
  { route: "Case study", lcpMs: 2_310, inpMs: 188, cls: 0.09, ttfbMs: 740 },
];

export const audience = {
  visitorId: "visitor-1042",
  experimentId: "hero-motion",
};

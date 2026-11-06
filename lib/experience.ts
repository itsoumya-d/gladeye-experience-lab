export type CwvRoute = {
  route: string;
  lcpMs: number;
  inpMs: number;
  cls: number;
  ttfbMs: number;
};

export type VariantStats = {
  name: string;
  exposures: number;
  conversions: number;
};

export type Experiment = {
  id: string;
  name: string;
  control: VariantStats;
  variant: VariantStats;
};

export type GateStatus = "ship" | "hold" | "fix";

export type ReleaseGate = {
  status: GateStatus;
  reasons: string[];
  uplift: number | null;
  zScore: number;
  significant: boolean;
  srm: boolean;
  cwvPass: boolean;
};

export const CWV_THRESHOLDS = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  ttfbMs: 800,
};

export function conversionRate(variant: VariantStats): number {
  if (variant.exposures <= 0) return 0;
  return variant.conversions / variant.exposures;
}

export function uplift(control: VariantStats, variant: VariantStats): number | null {
  const controlRate = conversionRate(control);
  if (controlRate === 0) return null;
  return (conversionRate(variant) - controlRate) / controlRate;
}

export function pooledRate(control: VariantStats, variant: VariantStats): number {
  const total = control.exposures + variant.exposures;
  if (total <= 0) return 0;
  return (control.conversions + variant.conversions) / total;
}

export function zScore(control: VariantStats, variant: VariantStats): number {
  const total = control.exposures + variant.exposures;
  if (total <= 0) return 0;
  const pooled = pooledRate(control, variant);
  const variance = pooled * (1 - pooled) * (1 / control.exposures + 1 / variant.exposures);
  if (variance <= 0) return 0;
  return (conversionRate(variant) - conversionRate(control)) / Math.sqrt(variance);
}

export function isSignificant(control: VariantStats, variant: VariantStats): boolean {
  return Math.abs(zScore(control, variant)) >= 1.96;
}

export function srmChiSquare(control: VariantStats, variant: VariantStats): number {
  const total = control.exposures + variant.exposures;
  if (total <= 0) return 0;
  const expected = total / 2;
  return ((control.exposures - expected) ** 2 + (variant.exposures - expected) ** 2) / expected;
}

export function hasSrm(control: VariantStats, variant: VariantStats): boolean {
  return srmChiSquare(control, variant) > 3.84;
}

export function cwvPass(route: CwvRoute): boolean {
  return (
    route.lcpMs <= CWV_THRESHOLDS.lcpMs &&
    route.inpMs <= CWV_THRESHOLDS.inpMs &&
    route.cls <= CWV_THRESHOLDS.cls &&
    route.ttfbMs <= CWV_THRESHOLDS.ttfbMs
  );
}

export function releaseGate(experiment: Experiment, routes: CwvRoute[]): ReleaseGate {
  const reasons: string[] = [];
  const failedRoutes = routes.filter((route) => !cwvPass(route));
  if (failedRoutes.length > 0) {
    reasons.push(`CWV fail: ${failedRoutes.map((route) => route.route).join(", ")}`);
  }
  const srm = hasSrm(experiment.control, experiment.variant);
  if (srm) reasons.push("sample ratio mismatch");
  const significant = isSignificant(experiment.control, experiment.variant);
  const upliftValue = uplift(experiment.control, experiment.variant);

  let status: GateStatus;
  if (failedRoutes.length > 0 || srm) {
    status = "fix";
  } else if (!significant) {
    status = "hold";
    reasons.push("experiment has not reached significance");
  } else if (upliftValue !== null && upliftValue > 0) {
    status = "ship";
    reasons.push("CWV pass, no SRM, positive significant uplift");
  } else {
    status = "fix";
    reasons.push("significant variant underperforms control");
  }

  return {
    status,
    reasons,
    uplift: upliftValue,
    zScore: zScore(experiment.control, experiment.variant),
    significant,
    srm,
    cwvPass: failedRoutes.length === 0,
  };
}

export function assignVariant(visitorId: string, experimentId: string): "A" | "B" {
  const input = `${visitorId}:${experimentId}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? "A" : "B";
}

export function formatPercent(value: number | null, digits = 2): string {
  if (value === null) return "n/a";
  return `${(value * 100).toFixed(digits)}%`;
}

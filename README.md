# gladeye-experience-lab

A Next.js/React/TypeScript experience lab for a creative digital agency:
deterministic A/B assignment, exposure/conversion metrics, relative uplift,
two-proportion significance, sample-ratio mismatch, Core Web Vitals budgets and
a release gate.

This is an independent reference implementation for Gladeye's digital
experience delivery workflow.

## Why this exists

A beautifully crafted site still has to earn its release. An agency needs to
know whether the experiment split is healthy, whether a variant actually
improved conversion, whether the result is statistically meaningful, and
whether the routes meet performance budgets. This lab reduces those questions
to one release decision.

## Formulas

```text
conversionRate = conversions / exposures
uplift         = (rateB - rateA) / rateA
pooledRate     = (convA + convB) / (nA + nB)
z              = (rateB - rateA) / sqrt(pooledRate * (1 - pooledRate) * (1/nA + 1/nB))
significant    = abs(z) >= 1.96
srmChiSquare   = ((nA - n/2)^2 + (nB - n/2)^2) / (n/2)
srm            = srmChiSquare > 3.84
cwvPass        = LCP <= 2500ms AND INP <= 200ms AND CLS <= 0.1 AND TTFB <= 800ms
releaseGate    = ship if CWV pass, no SRM, significant and uplift > 0
                 hold if CWV pass, no SRM and not significant
                 fix  if CWV fail, SRM or significant negative uplift
```

## UI

The dashboard shows experiment cards with release status, a selected variant
performance table, z-score/SRM/significance, a Core Web Vitals route table and a
release-gate panel. It uses Gladeye's dark #101010, white and grey tokens.

## Run

```bash
npm install
npm run dev
# or
npm run build
npm start
```

## Test

```bash
npm test
npm run build
```

Vitest covers conversion rates, uplift, pooled rates, z-scores, significance,
SRM, each CWV threshold, ship/hold/fix gate outcomes, deterministic assignment,
percentage formatting and seeded experiment outcomes.

## Design tokens

From Gladeye's live site:

- Heading/body: Soehne
- Background: `#101010`
- Surface: `#1A1A1A`
- Text: `#FFFFFF`
- Muted: `#A3A3A3`
- Accent: `#FFFFFF`
- Secondary: `#7D7D7D`
- Radius: `0px`
- Spacing unit: `8px`

## Stack

Next.js 15, React 19, TypeScript, Vitest and GitHub Actions.

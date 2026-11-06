"use client";

import { useMemo, useState } from "react";
import {
  assignVariant,
  conversionRate,
  cwvPass,
  formatPercent,
  hasSrm,
  isSignificant,
  releaseGate,
  uplift,
  zScore,
  type Experiment,
} from "../lib/experience";
import { audience, experiments, routes } from "../lib/seed";

const gateRoutes: Record<string, string[]> = {
  "hero-motion": ["Home", "Case study"],
  "pdp-proof": ["Home", "Case study"],
  "work-preview": ["Work index"],
};

export default function Home() {
  const [selectedId, setSelectedId] = useState(experiments[0].id);
  const selected = experiments.find((experiment) => experiment.id === selectedId) ?? experiments[0];
  const selectedRoutes = routes.filter((route) => (gateRoutes[selected.id] ?? []).includes(route.route));
  const gate = useMemo(() => releaseGate(selected, selectedRoutes), [selected, selectedRoutes]);
  const assigned = assignVariant(audience.visitorId, audience.experimentId);

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Gladeye · experience lab</p>
          <h1>Ship the experience. Prove the lift.</h1>
          <p className="lede">
            Experiments, conversions, sample-ratio health and Core Web Vitals
            in one release decision for high-craft digital experiences.
          </p>
        </div>
        <div className="mast-meta">
          <span>Next.js</span>
          <span>React</span>
          <span>TypeScript</span>
        </div>
      </header>

      <section className="metrics">
        <Metric label="Experiments" value={String(experiments.length)} />
        <Metric label="Visitors assigned" value={experiments.reduce((sum, item) => sum + item.control.exposures + item.variant.exposures, 0).toLocaleString()} />
        <Metric label="CWV routes passing" value={`${routes.filter(cwvPass).length}/${routes.length}`} />
        <Metric label="Sample visitor" value={`${assigned} · ${audience.experimentId}`} tone="light" />
      </section>

      <section className="grid">
        <div className="panel experiments">
          <div className="panel-head">
            <h2>Experiments</h2>
            <span>Click to inspect</span>
          </div>
          <div className="experiment-list">
            {experiments.map((experiment) => {
              const routesFor = routes.filter((route) => (gateRoutes[experiment.id] ?? []).includes(route.route));
              const itemGate = releaseGate(experiment, routesFor);
              return (
                <button
                  className={`experiment-row ${experiment.id === selected.id ? "active" : ""}`}
                  key={experiment.id}
                  onClick={() => setSelectedId(experiment.id)}
                >
                  <span>
                    <strong>{experiment.name}</strong>
                    <small>{experiment.control.exposures.toLocaleString()} control · {experiment.variant.exposures.toLocaleString()} variant</small>
                  </span>
                  <span className={`gate ${itemGate.status}`}>{itemGate.status}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className={`panel gate-panel ${gate.status}`}>
          <div className="panel-head">
            <h2>Release gate</h2>
            <span>{gate.status}</span>
          </div>
          <div className="gate-body">
            <p className="gate-status">{gate.status === "ship" ? "Ship it." : gate.status === "hold" ? "Hold for signal." : "Fix before release."}</p>
            <ul>
              {gate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <div className="split">
              <div><span>Uplift</span><strong>{formatPercent(gate.uplift)}</strong></div>
              <div><span>Z-score</span><strong>{gate.zScore.toFixed(2)}</strong></div>
              <div><span>Significant</span><strong>{gate.significant ? "Yes" : "No"}</strong></div>
              <div><span>SRM</span><strong>{gate.srm ? "Detected" : "Healthy"}</strong></div>
            </div>
          </div>
        </aside>

        <section className="panel variants">
          <div className="panel-head"><h2>Variant performance</h2><span>{selected.name}</span></div>
          <table>
            <thead><tr><th>Variant</th><th className="num">Exposures</th><th className="num">Conversions</th><th className="num">Rate</th><th className="num">Uplift</th></tr></thead>
            <tbody>
              {[selected.control, selected.variant].map((variant, index) => (
                <tr key={variant.name}>
                  <td><strong>{variant.name}</strong><small>{index === 0 ? "Control" : "Variant"}</small></td>
                  <td className="num">{variant.exposures.toLocaleString()}</td>
                  <td className="num">{variant.conversions.toLocaleString()}</td>
                  <td className="num">{formatPercent(conversionRate(variant))}</td>
                  <td className="num">{index === 0 ? "—" : formatPercent(uplift(selected.control, selected.variant))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="formula-bar">
            <span>z = {zScore(selected.control, selected.variant).toFixed(2)}</span>
            <span>significant = {isSignificant(selected.control, selected.variant) ? "true" : "false"}</span>
            <span>srm = {hasSrm(selected.control, selected.variant) ? "true" : "false"}</span>
          </div>
        </section>

        <section className="panel cwv">
          <div className="panel-head"><h2>Core Web Vitals</h2><span>LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1</span></div>
          <table>
            <thead><tr><th>Route</th><th className="num">LCP</th><th className="num">INP</th><th className="num">CLS</th><th className="num">TTFB</th><th>Status</th></tr></thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.route}>
                  <td><strong>{route.route}</strong></td>
                  <td className="num">{route.lcpMs.toLocaleString()}ms</td>
                  <td className="num">{route.inpMs}ms</td>
                  <td className="num">{route.cls.toFixed(2)}</td>
                  <td className="num">{route.ttfbMs}ms</td>
                  <td><span className={`badge ${cwvPass(route) ? "pass" : "fail"}`}>{cwvPass(route) ? "Pass" : "Fail"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      <footer><span>Next.js · React · TypeScript · Vitest</span><span>Reference implementation for Gladeye digital experiences</span></footer>
    </main>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "light" }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

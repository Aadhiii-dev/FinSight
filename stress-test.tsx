import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";
import { Loader2, Siren } from "lucide-react";
import { Card } from "@/components/Layout";
import { Help } from "@/components/Help";
import { ChartTable } from "@/components/ChartTable";
import { NeedData, Slider, inputCls } from "@/components/NeedData";
import { useStore } from "@/lib/store";
import { summarize, stressTest, defaultTargetFund, formatINR, type StressInput } from "@/lib/finance";

export const Route = createFileRoute("/stress-test")({
  head: () => ({
    meta: [
      { title: "Stress Test & Digital Twin — Finsight" },
      { name: "description", content: "Simulate income drops, late payments and medical bills across 1,000 scenarios to see your risk of running out of money." },
      { property: "og:title", content: "Stress Test & Digital Twin — Finsight" },
      { property: "og:description", content: "1,000 simulated futures show how your finances hold up under shocks." },
    ],
  }),
  component: Stress,
});

const short = (n: number) => (Math.abs(n) >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n / 1000)}k`);
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Stress() {
  const { rows, profile, consent, hydrated } = useStore();
  const [drop, setDrop] = useState(0);
  const [delayP, setDelayP] = useState(10);
  const [delayL, setDelayL] = useState(1);
  const [med, setMed] = useState(0);
  const [medM, setMedM] = useState(6);
  const [infl, setInfl] = useState(6);
  const [result, setResult] = useState<ReturnType<typeof stressTest> | null>(null);
  const [running, setRunning] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [emAmt, setEmAmt] = useState(200000);

  const sm = useMemo(() => (rows.length >= 2 ? summarize(rows, profile) : null), [rows, profile]);
  const target = sm ? defaultTargetFund(sm.avgEssential, sm.stability, profile.insuranceCover).target : 0;

  useEffect(() => {
    if (!sm) return;
    setRunning(true);
    const id = setTimeout(() => {
      const input: StressInput = { incomeDrop: drop / 100, delayProb: delayP / 100, delayLen: delayL, medicalCost: med, medicalMonth: medM, expenseInflation: infl / 100, target };
      setResult(stressTest(rows, profile.currentSavings, input));
      setRunning(false);
    }, 250);
    return () => clearTimeout(id);
  }, [rows, profile.currentSavings, drop, delayP, delayL, med, medM, infl, target, sm]);

  if (!hydrated) return <p className="text-muted-foreground">Loading…</p>;
  if (!consent || !sm) return <NeedData />;

  const recs: string[] = [];
  if (result) {
    if (result.pRunOut > 0.2) recs.push(`There is a ${pct(result.pRunOut)} chance of running short. Cut one non-essential expense — your "other" spending averages ${formatINR(sm.avgOther)} a month.`);
    if (delayP >= 20) recs.push(`Payments are often late, so pay rent and the electricity bill as soon as income arrives, and keep at least ${formatINR(sm.avgEssential)} (one month of essentials) untouched.`);
    if (med > profile.insuranceCover) recs.push(`A ${formatINR(med)} medical bill is more than your ${formatINR(profile.insuranceCover)} cover. A health insurance top-up could close this gap cheaply.`);
    if (result.pReach < 0.5) recs.push(`Only ${pct(result.pReach)} of scenarios reach your ${formatINR(target)} target in a year — try the Emergency Planner for a longer, steadier plan.`);
    if (!recs.length) recs.push("You hold up well in most scenarios. Keep saving automatically on payday so it stays that way.");
  }

  // Emergency mode waterfall
  const fromIns = Math.min(emAmt, profile.insuranceCover);
  const afterIns = emAmt - fromIns;
  const keep = sm.avgEssential; // keep one month of essentials
  const fromSav = Math.min(afterIns, Math.max(0, profile.currentSavings - keep));
  const borrow = afterIns - fromSav;
  const monthlySurplus = Math.max(1, sm.avgSavings);
  const recovery = Math.ceil((fromSav + borrow * 1.12) / monthlySurplus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Stress Test</h1>
          <p className="text-muted-foreground">Your financial digital twin. Based on 1,000 simulated scenarios.</p>
        </div>
        <button onClick={() => setEmergency(!emergency)} aria-expanded={emergency} className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 font-semibold text-destructive-foreground">
          <Siren className="h-5 w-5" aria-hidden /> Emergency Mode
        </button>
      </div>

      {emergency && (
        <Card className="border-destructive/40">
          <h2 className="text-lg font-semibold">I have a sudden expense right now</h2>
          <label className="mt-3 block max-w-xs"><span className="mb-1 block text-sm font-medium">Amount (₹)</span>
            <input className={inputCls} type="number" min={0} value={emAmt} onChange={(e) => setEmAmt(Math.max(0, Number(e.target.value) || 0))} /></label>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            <li className="rounded-xl bg-secondary p-4"><div className="text-sm text-muted-foreground">1. Claim insurance</div><div className="text-2xl font-semibold">{formatINR(fromIns)}</div></li>
            <li className="rounded-xl bg-muted p-4"><div className="text-sm text-muted-foreground">2. Use savings (keeping {formatINR(keep)} for essentials)</div><div className="text-2xl font-semibold">{formatINR(fromSav)}</div></li>
            <li className="rounded-xl bg-warning/20 p-4"><div className="text-sm text-muted-foreground">3. Borrow (last resort)</div><div className="text-2xl font-semibold">{formatINR(borrow)}</div></li>
          </ol>
          <p className="mt-3 text-sm">For medical bills insurance usually pays first; for other costs it won't apply. Recovery: about <b>{recovery} months</b> at your average surplus of {formatINR(sm.avgSavings)}/month{borrow > 0 && " (assuming ~12% interest on borrowing)"}. Range: {Math.ceil(recovery * 0.8)}–{Math.ceil(recovery * 1.4)} months.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold">What if…</h2>
          <Slider label="Income drops by" min={0} max={60} step={5} value={drop} onChange={setDrop} display={`${drop}%`} />
          <Slider label="Chance a payment is late" min={0} max={50} step={5} value={delayP} onChange={setDelayP} display={`${delayP}%`} />
          <Slider label="Delay length" min={1} max={3} step={1} value={delayL} onChange={setDelayL} display={`${delayL} month${delayL > 1 ? "s" : ""}`} />
          <Slider label="Sudden medical expense" min={0} max={1000000} step={25000} value={med} onChange={setMed} display={formatINR(med)} />
          <Slider label="…in month" min={1} max={12} step={1} value={medM} onChange={setMedM} display={`Month ${medM}`} />
          <Slider label="Expense inflation" help={<Help label="expense inflation" text="How much your everyday costs rise each year." />} min={0} max={15} step={1} value={infl} onChange={setInfl} display={`${infl}%/yr`} />
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3" aria-live="polite">
            <Metric label="Chance of running out of money" value={result ? pct(result.pRunOut) : "–"} help="Share of the 1,000 scenarios where your balance went below ₹0 at least once." />
            <Metric label="Most likely month to run out" value={result ? (result.riskMonth ? `Month ${result.riskMonth}` : "None") : "–"} help="The month in which balances most often first dropped below zero." />
            <Metric label="Chance of reaching target" value={result ? pct(result.pReach) : "–"} help={`Share of scenarios that reached ${formatINR(target)} within 12 months.`} />
          </div>
          <Card className="relative">
            <h2 className="flex items-center text-lg font-semibold">Cash balance range<Help label="percentiles" text="10th percentile = a bad case (only 1 in 10 is worse). 50th = the middle. 90th = a good case." /></h2>
            <p className="text-sm text-muted-foreground">Based on 1,000 simulated scenarios.</p>
            {running && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/70"><Loader2 className="h-8 w-8 animate-spin text-primary" role="status" aria-label="Running simulation" /></div>}
            {result && (
              <div className="h-72" role="img" aria-label={`Line chart of simulated cash balance over 12 months. A data table follows the chart. After 12 months balance between ${formatINR(result.fan[11]!.p10)} and ${formatINR(result.fan[11]!.p90)}, median ${formatINR(result.fan[11]!.p50)}`}>
                <ResponsiveContainer>
                  <LineChart data={result.fan}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis tickFormatter={short} fontSize={12} width={56} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} />
                    <Legend />
                    <ReferenceLine y={0} stroke="var(--destructive)" />
                    <Line dataKey="p90" name="90th (good)" stroke="var(--chart-3)" strokeDasharray="6 3" strokeWidth={2} dot={false} />
                    <Line dataKey="p50" name="50th (middle)" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
                    <Line dataKey="p10" name="10th (bad)" stroke="var(--chart-4)" strokeDasharray="2 3" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {result && <ChartTable caption="Simulated cash balance by month" headers={["Month", "Bad case (10th)", "Middle (50th)", "Good case (90th)"]} rows={result.fan.map((d) => [String(d.month), formatINR(d.p10), formatINR(d.p50), formatINR(d.p90)])} />}
            {result && <p className="mt-3 text-sm">After 12 months: between <b>{formatINR(result.fan[11]!.p10)}</b> and <b>{formatINR(result.fan[11]!.p90)}</b>, most likely {formatINR(result.fan[11]!.p50)}.</p>}
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">What you can do</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">{recs.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card>
      <div className="flex items-center text-sm text-muted-foreground">{label}<Help label={label} text={help} /></div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

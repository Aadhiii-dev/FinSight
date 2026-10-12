import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/Layout";
import { Help } from "@/components/Help";
import { ChartTable } from "@/components/ChartTable";
import { NeedData, Slider, inputCls } from "@/components/NeedData";
import { useStore } from "@/lib/store";
import { summarize, percentile, planFund, minAffordableMonths, growthPath, recommendedCover, formatINR } from "@/lib/finance";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Emergency Planner — Finsight" },
      { name: "description", content: "Find exactly how much to save each month for surgery, accident, critical illness or job loss, with every step shown." },
      { property: "og:title", content: "Emergency Planner — Finsight" },
      { property: "og:description", content: "Your monthly saving target for a sudden emergency, explained step by step." },
    ],
  }),
  component: Planner,
});

const TYPES = [
  { id: "surgery", label: "Major surgery", cost: 300000 },
  { id: "accident", label: "Accident with hospitalisation", cost: 500000 },
  { id: "critical", label: "Critical illness", cost: 1000000 },
  { id: "job", label: "Job loss (6 months of essentials)", cost: 0 },
  { id: "custom", label: "Custom amount", cost: 200000 },
];
const short = (n: number) => (Math.abs(n) >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n / 1000)}k`);

function Planner() {
  const { rows, profile, consent, hydrated } = useStore();
  const ok = hydrated && consent && rows.length >= 2;
  const sm = useMemo(() => (rows.length >= 2 ? summarize(rows, profile) : null), [rows, profile]);
  const unstable = sm ? sm.stability !== "Stable" : false;

  const [type, setType] = useState("surgery");
  const [costs, setCosts] = useState<Record<string, number>>(Object.fromEntries(TYPES.map((t) => [t.id, t.cost])));
  const [months, setMonths] = useState(24);
  const [inflation, setInflation] = useState(10);
  const [ret, setRet] = useState(6);
  const [buffer, setBuffer] = useState<number | null>(null);

  if (!hydrated) return <p className="text-muted-foreground">Loading…</p>;
  if (!ok || !sm) return <NeedData />;

  const bufferMonths = buffer ?? (unstable ? 6 : 3);
  const cost = type === "job" ? 6 * sm.avgEssential : costs[type]!;
  const insurance = type === "job" ? 0 : profile.insuranceCover;
  const base = { cost, insurance, inflation: type === "job" ? 0 : inflation / 100, annualReturn: ret / 100, bufferMonths, avgEssential: sm.avgEssential, months, currentSavings: profile.currentSavings };
  const plan = planFund(base);
  const incomes = rows.map((r) => r.income);
  const planningIncome = unstable ? percentile(incomes, 0.25) : sm.avgIncome;
  const surplus = planningIncome - sm.avgExpenses;
  const affordable = plan.value <= surplus;
  const suggest = affordable ? null : minAffordableMonths(base, surplus);
  const path = growthPath(profile.currentSavings, plan.value, plan.r, months, plan.target);
  const rec = recommendedCover(profile.dependents);
  const gap = Math.max(0, rec - profile.insuranceCover);

  // flexible plan: weak months (income < median) save x, strong months save 2.5x; total = plan.value*months
  const median = percentile(incomes, 0.5);
  const weakShare = incomes.filter((i) => i < median).length / incomes.length;
  const weakAmt = plan.value / (weakShare + 2.5 * (1 - weakShare));
  const strongAmt = weakAmt * 2.5;

  const strategies = [12, 24, 48].map((n, i) => {
    const p = planFund({ ...base, months: n });
    return { name: ["Aggressive", "Balanced", "Relaxed"][i], n, monthly: p.value, total: p.value * n, ok: p.value <= surplus };
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Emergency Planner</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Emergency type</span>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          {type !== "job" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Estimated cost (₹)</span>
              <input className={inputCls} type="number" min={0} value={costs[type]} onChange={(e) => setCosts({ ...costs, [type]: Math.max(0, Number(e.target.value) || 0) })} />
              <span className="mt-1 block text-xs text-muted-foreground">Illustrative estimates, edit as needed.</span>
            </label>
          ) : <p className="text-sm text-muted-foreground">Cost = 6 × {formatINR(sm.avgEssential)} = {formatINR(cost)}</p>}
          <Slider label="Time to build the fund" min={6} max={60} step={1} value={months} onChange={setMonths} display={`${months} months`} />
          <fieldset className="space-y-4 rounded-xl bg-muted p-4">
            <legend className="text-sm font-semibold">Assumptions</legend>
            <Slider label="Medical inflation" help={<Help label="medical inflation" text="How fast hospital costs rise each year. In India this is often 10–14%." />} min={0} max={20} step={0.5} value={inflation} onChange={setInflation} display={`${inflation}%/yr`} />
            <Slider label="Savings return" help={<Help label="savings return" text="Interest your fund earns, e.g. from an FD or liquid fund." />} min={0} max={12} step={0.5} value={ret} onChange={setRet} display={`${ret}%/yr`} />
            <Slider label="Buffer months" help={<Help label="buffer" text="Extra months of essential expenses kept aside for living costs during the emergency." />} min={0} max={12} step={1} value={bufferMonths} onChange={setBuffer} display={`${bufferMonths} months`} />
          </fieldset>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <section className="bg-hero rounded-3xl p-6 text-primary-foreground">
            {plan.value === 0 ? (
              <p className="font-display text-3xl font-semibold">You're already covered ✓</p>
            ) : (
              <>
                <p className="font-display text-3xl font-semibold md:text-4xl">Save {formatINR(plan.value)} per month for {months} months</p>
                <p className="mt-2 text-lg opacity-90">That is about {formatINR((plan.value * 12) / 52)} per week.</p>
              </>
            )}
            <p className="mt-2 opacity-90">Target fund: {formatINR(plan.target)}</p>
          </section>

          {!affordable && plan.value > 0 && (
            <div role="alert" className="flex gap-3 rounded-2xl border border-warning bg-warning/20 p-4 text-warning-foreground">
              <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">This target is too high for your current surplus ({formatINR(Math.max(0, surplus))}/month).</p>
                <p>{suggest ? <>Try <button className="font-semibold underline" onClick={() => setMonths(Math.min(60, suggest))}>{suggest} months</button> to make it affordable{suggest > 60 && " (beyond the 60-month slider)"}.</> : "Reduce expenses or the target first — your surplus is too small right now."}</p>
              </div>
            </div>
          )}

          <Card>
            <h2 className="text-lg font-semibold">Your fund growing month by month</h2>
            <div className="h-64" role="img" aria-label={`Line chart: your fund grows from ${formatINR(profile.currentSavings)} to ${formatINR(path[path.length - 1]!.balance)} over ${months} months, against a target of ${formatINR(plan.target)}. A data table follows the chart.`}>
              <ResponsiveContainer>
                <LineChart data={path}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis tickFormatter={short} fontSize={12} width={52} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} labelFormatter={(l) => `Month ${l}`} />
                  <Legend />
                  <Line dataKey="balance" name="Your fund" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
                  <Line dataKey="target" name="Target" stroke="var(--chart-2)" strokeDasharray="6 4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ChartTable caption="Fund balance by month" headers={["Month", "Your fund", "Target"]} rows={path.map((d) => [String(d.month), formatINR(d.balance), formatINR(d.target)])} />
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {unstable && plan.value > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">Flexible plan for changing income</h2>
            <p className="mt-1 text-sm text-muted-foreground">Same total, but adjusted to your good and weak months.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted p-4"><div className="text-sm text-muted-foreground">Weak months (income below {formatINR(median)})</div><div className="text-2xl font-semibold">{formatINR(weakAmt)}</div></div>
              <div className="rounded-xl bg-secondary p-4"><div className="text-sm text-muted-foreground">Strong months</div><div className="text-2xl font-semibold">{formatINR(strongAmt)}</div></div>
            </div>
          </Card>
        )}
        <Card>
          <h2 className="flex items-center text-lg font-semibold">Insurance gap check<Help label="recommended cover" text="₹5,00,000 per adult plus ₹3,00,000 per dependent." /></h2>
          <p className="mt-2">Your cover: <b>{formatINR(profile.insuranceCover)}</b> · Recommended: <b>{formatINR(rec)}</b></p>
          {gap > 0 ? <p className="mt-2 text-muted-foreground">Gap of {formatINR(gap)}. You may want to consider a health insurance top-up plan — they are often an affordable way to raise cover.</p>
            : <p className="mt-2 flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" aria-hidden /> Your cover meets the recommendation.</p>}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Compare strategies</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead className="text-sm text-muted-foreground"><tr><th className="p-2">Strategy</th><th className="p-2">Monthly saving</th><th className="p-2">Total saved</th><th className="p-2">Affordable?</th></tr></thead>
            <tbody>{strategies.map((s) => (
              <tr key={s.name} className="border-t"><td className="p-2 font-medium">{s.name} ({s.n} mo)</td><td className="p-2 tabular-nums">{formatINR(s.monthly)}</td><td className="p-2 tabular-nums">{formatINR(s.total)}</td>
                <td className="p-2">{s.ok ? <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">Yes</span> : <span className="rounded-full bg-warning/25 px-2 py-0.5 text-warning-foreground">Too high</span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer text-lg font-semibold">How we calculated this</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>Out-of-pocket = max(0, {formatINR(cost)} − {formatINR(insurance)}) = <b>{formatINR(plan.oop)}</b></li>
            <li>Inflated cost = {formatINR(plan.oop)} × (1 + {base.inflation * 100}%)^({months}/12) = <b>{formatINR(plan.inflated)}</b></li>
            <li>Target = {formatINR(plan.inflated)} + {bufferMonths} × {formatINR(sm.avgEssential)} = <b>{formatINR(plan.target)}</b></li>
            <li>Monthly rate r = (1 + {ret}%)^(1/12) − 1 = <b>{(plan.r * 100).toFixed(3)}%</b>, n = {months}</li>
            <li>Required = (Target − {formatINR(profile.currentSavings)} × (1+r)^n) × r / ((1+r)^n − 1) = <b>{formatINR(plan.raw)}</b>{plan.raw < 0 && " → ₹0 (already covered)"}</li>
            <li>Planning income ({unstable ? "25th percentile, conservative" : "average"}) = <b>{formatINR(planningIncome)}</b></li>
            <li>Surplus = {formatINR(planningIncome)} − {formatINR(sm.avgExpenses)} = <b>{formatINR(surplus)}</b> → {affordable ? "affordable" : "too high"}</li>
          </ol>
        </details>
      </Card>
    </div>
  );
}

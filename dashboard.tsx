import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { Card } from "@/components/Layout";
import { Help } from "@/components/Help";
import { ChartTable } from "@/components/ChartTable";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { summarize, forecastSavings, readinessScore, recommendedCover, defaultTargetFund, formatINR } from "@/lib/finance";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Financial Dashboard — Finsight" },
      { name: "description", content: "See your average income, spending, savings rate, income stability, 12-month forecast and Emergency Readiness Score." },
      { property: "og:title", content: "Your Financial Dashboard — Finsight" },
      { property: "og:description", content: "Income stability, savings forecast and Emergency Readiness Score in one view." },
    ],
  }),
  component: Dashboard,
});

const short = (n: number) => (Math.abs(n) >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n / 1000)}k`);
const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Dashboard() {
  const { rows, profile, consent, hydrated } = useStore();
  const t = useT();
  const [why, setWhy] = useState(false);

  const data = useMemo(() => {
    if (rows.length < 2) return null;
    const sm = summarize(rows, profile);
    const rec = recommendedCover(profile.dependents);
    const tf = defaultTargetFund(sm.avgEssential, sm.stability, profile.insuranceCover);
    const rs = readinessScore({ currentSavings: profile.currentSavings, targetFund: tf.target, savingsRate: sm.savingsRate, stability: sm.stability, insuranceCover: profile.insuranceCover, recommendedCover: rec });
    const fc = forecastSavings(rows, profile.currentSavings).map((d) => ({ ...d, band: [d.worst, d.best] as [number, number] }));
    return { sm, rec, tf, rs, fc };
  }, [rows, profile]);

  if (!hydrated) return <p className="text-muted-foreground">Loading…</p>;
  if (!data || !consent)
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-3xl font-semibold">{!data ? "No data yet" : "Consent needed"}</h1>
        <p className="mt-3 text-muted-foreground">{!data ? "Load a demo persona or add at least 2 months of your own data to see your dashboard." : "Please confirm on Home that you understand your data is processed only in your browser."}</p>
        <Link to="/" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground">{t("loadDemo")}</Link>
      </Card>
    );

  const { sm, rec, tf, rs, fc } = data;
  const last = fc[fc.length - 1]!;
  const monthly = rows.map((r) => ({ month: r.month.slice(2), income: r.income, expenses: r.essential_expenses + r.other_expenses }));
  const pie = [{ name: "Essential", value: Math.round(sm.avgEssential) }, { name: "Other", value: Math.round(sm.avgOther) }];
  const tone = rs.score <= 40 ? "text-destructive" : rs.score <= 70 ? "text-warning-foreground" : "text-success";
  const stabTone = sm.stability === "Stable" ? "bg-success/15 text-success" : sm.stability === "Moderate" ? "bg-warning/25 text-warning-foreground" : "bg-destructive/10 text-destructive";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("dashboard")}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={t("avgIncome")} value={formatINR(sm.avgIncome)} help="Total income divided by number of months." />
        <Stat label={t("avgExpenses")} value={formatINR(sm.avgExpenses)} help="Essential + other spending, averaged per month." />
        <Stat label={t("avgSavings")} value={formatINR(sm.avgSavings)} help="Income minus expenses, on average." />
        <Stat label={t("savingsRate")} value={`${(sm.savingsRate * 100).toFixed(1)}%`} help="Share of income you keep. 20% or more is a healthy target." />
        <Card className="col-span-2 lg:col-span-1">
          <div className="flex items-center text-sm text-muted-foreground">{t("stability")}<Help label="income stability" text="Based on coefficient of variation (CV = how much income swings vs. its average). CV < 0.15 Stable, 0.15–0.25 Moderate, > 0.25 Unstable." /></div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-lg font-semibold ${stabTone}`}>{sm.stability}</div>
          <div className="mt-1 text-sm text-muted-foreground">CV = {sm.cv.toFixed(2)}{profile.incomeType !== "Auto" && ` (detected ${sm.detected})`}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="flex items-center text-lg font-semibold">{t("readiness")}<Help label="readiness score" text="A 0–100 measure of how prepared you are for a sudden expense." /></h2>
          <Gauge score={rs.score} />
          <p className={`text-center text-xl font-semibold ${tone}`}>{rs.label}</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">Your savings cover {Math.round(rs.parts.a * 100)}% of a {formatINR(tf.target)} emergency target.</p>
          <button onClick={() => setWhy(!why)} aria-expanded={why} className="mt-4 w-full rounded-xl bg-muted py-2 text-sm font-medium">Why this score? {why ? "▲" : "▼"}</button>
          {why && (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-muted-foreground">Target fund = {formatINR(tf.oop)} (major surgery ₹3,00,000 minus insurance) + {tf.bufferMonths} months × {formatINR(sm.avgEssential)} essentials = <b>{formatINR(tf.target)}</b></p>
              <Row k={`40% × min(1, ${formatINR(profile.currentSavings)} / ${formatINR(tf.target)})`} v={40 * rs.parts.a} />
              <Row k={`25% × min(1, ${(sm.savingsRate * 100).toFixed(1)}% / 20%)`} v={25 * rs.parts.b} />
              <Row k={`20% × stability (${sm.stability} = ${rs.parts.stabilityScore})`} v={20 * rs.parts.c} />
              <Row k={`15% × min(1, ${formatINR(profile.insuranceCover)} / ${formatINR(rec)})`} v={15 * rs.parts.d} />
              <p className="text-xs text-muted-foreground">Recommended cover = ₹5,00,000 per adult + ₹3,00,000 per dependent.</p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Income vs expenses by month</h2>
          <div className="h-72" role="img" aria-label={`Bar chart of monthly income with a line for monthly expenses over ${monthly.length} months. Average income ${formatINR(sm.avgIncome)}, average expenses ${formatINR(sm.avgExpenses)}. A data table follows the chart.`}>
            <ResponsiveContainer>
              <ComposedChart data={monthly} margin={{ left: 0, right: 8, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis tickFormatter={short} fontSize={12} width={52} />
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Legend />
                <Bar dataKey="income" name="Income" fill={C[0]} radius={[6, 6, 0, 0]} />
                <Line dataKey="expenses" name="Expenses" stroke={C[1]} strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartTable caption="Monthly income and expenses" headers={["Month", "Income", "Expenses"]} rows={monthly.map((m) => [m.month, formatINR(m.income), formatINR(m.expenses)])} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="flex items-center text-lg font-semibold">12-month savings forecast<Help label="Monte Carlo" text="We replay 1,000 possible futures by randomly picking months from your own history. Worst = 10th percentile, Likely = median, Best = 90th percentile." /></h2>
          <p className="text-sm text-muted-foreground">Based on 1,000 simulated scenarios, starting from {formatINR(profile.currentSavings)}.</p>
          <div className="h-72" role="img" aria-label={`Line chart of your 12-month savings forecast with worst, likely and best cases. After 12 months: worst ${formatINR(last.worst)}, likely ${formatINR(last.likely)}, best ${formatINR(last.best)}. A data table follows the chart.`}>
            <ResponsiveContainer>
              <LineChart data={fc} margin={{ left: 0, right: 8, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis tickFormatter={short} fontSize={12} width={52} />
                <Tooltip formatter={(v) => (Array.isArray(v) ? `${formatINR(Number(v[0]))} – ${formatINR(Number(v[1]))}` : formatINR(Number(v)))} />
                <Legend />
                <Area dataKey="band" name="Range" fill={C[0]} fillOpacity={0.12} stroke="none" legendType="none" />
                <Line dataKey="best" name="Best case" stroke={C[2]} strokeWidth={2} strokeDasharray="6 3" dot={false} />
                <Line dataKey="likely" name="Likely" stroke={C[0]} strokeWidth={3} dot={false} />
                <Line dataKey="worst" name="Worst case" stroke={C[3]} strokeWidth={2} strokeDasharray="2 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartTable caption="Savings forecast by month" headers={["Month", "Worst case", "Likely", "Best case"]} rows={fc.map((d) => [String(d.month), formatINR(d.worst), formatINR(d.likely), formatINR(d.best)])} />
          <p className="mt-3 text-sm">In 12 months you will likely have <b>{formatINR(last.likely)}</b> (range {formatINR(last.worst)} – {formatINR(last.best)}).</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Expense breakdown</h2>
          <div className="h-60" role="img" aria-label={`Donut chart of monthly spending. Essential ${formatINR(sm.avgEssential)}, other ${formatINR(sm.avgOther)} per month. A data table follows the chart.`}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pie.map((_, i) => <Cell key={i} fill={C[i === 0 ? 0 : 1]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartTable caption="Average monthly spending split" headers={["Type", "Per month"]} rows={pie.map((p) => [p.name, formatINR(p.value)])} />
          <p className="mt-3 text-sm text-muted-foreground">{Math.round((sm.avgEssential / Math.max(1, sm.avgExpenses)) * 100)}% of your spending is essential.</p>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card>
      <div className="flex items-center text-sm text-muted-foreground">{label}<Help label={label} text={help} /></div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return <div className="flex justify-between gap-2 border-b pb-1"><span>{k}</span><b className="tabular-nums">{v.toFixed(1)}</b></div>;
}

function Gauge({ score }: { score: number }) {
  const a = Math.PI * (1 - score / 100);
  const x = 100 + 80 * Math.cos(a), y = 100 - 80 * Math.sin(a);
  const color = score <= 40 ? "var(--destructive)" : score <= 70 ? "var(--warning)" : "var(--success)";
  return (
    <svg viewBox="0 0 200 115" className="mx-auto mt-2 w-full max-w-[240px]" role="img" aria-label={`Score ${score} out of 100`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="16" strokeLinecap="round" />
      {score > 0 && <path d={`M20 100 A80 80 0 0 1 ${x} ${y}`} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />}
      <text x="100" y="95" textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--foreground)">{score}</text>
    </svg>
  );
}

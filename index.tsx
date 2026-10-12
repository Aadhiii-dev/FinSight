import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Sparkles, Plus, Trash2, Lock } from "lucide-react";
import { Card } from "@/components/Layout";
import { Help } from "@/components/Help";
import { PrivacyConsent } from "@/components/PrivacyConsent";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { PERSONAS, parseCSV, formatINR, type MonthRow, type CityTier, type IncomeType } from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finsight — Emergency Fund Planner for India" },
      { name: "description", content: "Find out exactly how much to save each month for a medical emergency or job loss. Private, in-browser, built for salaried and gig workers." },
      { property: "og:title", content: "Finsight — Emergency Fund Planner for India" },
      { property: "og:description", content: "Your financial digital twin: forecast savings and plan for emergencies, privately in your browser." },
    ],
  }),
  component: HomePage,
});

const inputCls = "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const num = (v: string) => Math.max(0, Number(v) || 0);

function HomePage() {
  const s = useStore();
  const t = useT();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [tab, setTab] = useState<"demo" | "csv" | "manual">("demo");

  const loadPersona = (id: string) => {
    if (!s.consent) return; // IS 17428: no data entry before consent
    const p = PERSONAS.find((x) => x.id === id)!;
    s.set({ rows: p.rows, profile: p.profile, personaId: id });
    setMsgs([`Loaded 12 months for ${p.name}.`]);
  };

  const onFile = async (f?: File) => {
    if (!f || !s.consent) return;
    if (f.size > 200_000) return setMsgs(["File too large (max 200 KB)."]);
    const { rows, errors } = parseCSV(await f.text());
    if (rows.length) s.set({ rows, personaId: null });
    setMsgs([rows.length ? `Imported ${rows.length} months.` : "No valid rows found.", ...errors]);
  };

  const updateRow = (i: number, patch: Partial<MonthRow>) =>
    s.set({ rows: s.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)), personaId: null });
  const addRow = () => {
    if (!s.consent || s.rows.length >= 24) return;
    const d = new Date(); d.setMonth(d.getMonth() - (24 - s.rows.length));
    s.set({ rows: [...s.rows, { month: d.toISOString().slice(0, 7), income: 0, essential_expenses: 0, other_expenses: 0 }] });
  };

  const canAnalyse = s.consent && s.rows.length >= 2;
  const TABS = ["demo", "csv", "manual"] as const;
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[n]!);
    document.getElementById(`tab-${TABS[n]}`)?.focus();
  };
  const startDemo = () => {
    if (!s.consent) {
      // Send the user to the privacy notice first.
      const box = document.querySelector<HTMLInputElement>("#privacy input[type=checkbox]");
      document.getElementById("privacy")?.scrollIntoView({ behavior: "smooth", block: "center" });
      box?.focus();
      return;
    }
    loadPersona("priya");
    setTab("demo");
  };

  return (
    <div className="space-y-8">
      <section className="bg-hero rounded-3xl p-8 text-primary-foreground md:p-12">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-sm"><Lock className="h-4 w-4" aria-hidden /> {t("localOnly")}</p>
        <h1 className="font-display max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">{t("heroTitle")}</h1>
        <p className="mt-4 max-w-2xl text-lg opacity-90">{t("heroSub")}</p>
        <button onClick={startDemo} className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-lg font-semibold text-primary shadow-card hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring">
          <Sparkles className="h-5 w-5" aria-hidden /> {t("loadDemo")}
        </button>
      </section>

      <PrivacyConsent />

      <fieldset disabled={!s.consent} className={`m-0 min-w-0 border-0 p-0 ${s.consent ? "" : "opacity-60"}`}>
      <legend className="sr-only">Your financial data (available after you give consent)</legend>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div role="tablist" aria-label="Ways to add data" onKeyDown={onTabKey} className="mb-5 flex flex-wrap gap-2">
            {TABS.map((k) => (
              <button key={k} id={`tab-${k}`} role="tab" aria-selected={tab === k} aria-controls="data-panel" tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                {k === "demo" ? t("loadDemo") : k === "csv" ? t("uploadCsv") : t("manual")}
              </button>
            ))}
          </div>

          <div id="data-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "demo" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {PERSONAS.map((p) => (
                <button key={p.id} onClick={() => loadPersona(p.id)} aria-pressed={s.personaId === p.id}
                  className={`rounded-2xl border-2 p-4 text-left transition hover:border-primary ${s.personaId === p.id ? "border-primary bg-secondary" : "border-border"}`}>
                  <div className="font-display text-xl font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{p.tagline}</div>
                </button>
              ))}
            </div>
          )}

          {tab === "csv" && (
            <div className="rounded-2xl border-2 border-dashed p-6 text-center">
              <p className="text-muted-foreground">Columns: <code>month, income, essential_expenses, other_expenses</code></p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="CSV file" onChange={(e) => onFile(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground">
                <Upload className="h-4 w-4" aria-hidden /> {t("uploadCsv")}
              </button>
            </div>
          )}

          {tab === "manual" && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr><th className="p-2">Month</th><th className="p-2">Income (₹)</th><th className="p-2">Essential (₹) <Help label="essential expenses" text="Must-pay costs: rent, food, bills, EMIs, school fees, medicines." /></th><th className="p-2">Other (₹)</th><th /></tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1"><input aria-label={`Month ${i + 1}`} className={inputCls} type="month" value={r.month} onChange={(e) => updateRow(i, { month: e.target.value })} /></td>
                        {(["income", "essential_expenses", "other_expenses"] as const).map((k) => (
                          <td key={k} className="p-1"><input aria-label={`${k} month ${i + 1}`} className={inputCls} type="number" min={0} inputMode="numeric" value={r[k]} onChange={(e) => updateRow(i, { [k]: num(e.target.value) })} /></td>
                        ))}
                        <td className="p-1"><button aria-label={`Remove month ${i + 1}`} onClick={() => s.set({ rows: s.rows.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addRow} disabled={s.rows.length >= 24} className="mt-3 inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-50">
                <Plus className="h-4 w-4" aria-hidden /> Add month ({s.rows.length}/24)
              </button>
            </div>
          )}

          </div>

          {msgs.length > 0 && <ul aria-live="polite" className="mt-4 space-y-1 text-sm text-muted-foreground">{msgs.map((m, i) => <li key={i}>{m}</li>)}</ul>}
          {s.rows.length > 0 && tab !== "manual" && (
            <p className="mt-4 text-sm text-muted-foreground">{s.rows.length} months loaded · avg income {formatINR(s.rows.reduce((a, r) => a + r.income, 0) / s.rows.length)}. Switch to "{t("manual")}" to edit.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-display mb-4 text-2xl font-semibold">{t("yourDetails")}</h2>
          <div className="space-y-4">
            <Field label={t("savings")} help="Money you can use right away: bank balance, FDs you can break, cash.">
              <input id="f-savings" className={inputCls} type="number" min={0} value={s.profile.currentSavings} onChange={(e) => s.setProfile({ currentSavings: num(e.target.value) })} />
            </Field>
            <Field label={t("insurance")} help="Total sum insured by your health policy, including employer cover.">
              <input id="f-ins" className={inputCls} type="number" min={0} value={s.profile.insuranceCover} onChange={(e) => s.setProfile({ insuranceCover: num(e.target.value) })} />
            </Field>
            <Field label={t("dependents")} help="People who rely on your income: children, parents, spouse.">
              <input className={inputCls} type="number" min={0} max={15} value={s.profile.dependents} onChange={(e) => s.setProfile({ dependents: Math.min(15, Math.floor(num(e.target.value))) })} />
            </Field>
            <Field label={t("cityTier")} help="Metro costs are usually higher than Tier 2 and Tier 3 cities.">
              <select className={inputCls} value={s.profile.cityTier} onChange={(e) => s.setProfile({ cityTier: e.target.value as CityTier })}>
                <option>Metro</option><option>Tier 2</option><option>Tier 3</option>
              </select>
            </Field>
            <Field label={t("incomeType")} help="Auto-detect looks at how much your monthly income changes.">
              <select className={inputCls} value={s.profile.incomeType} onChange={(e) => s.setProfile({ incomeType: e.target.value as IncomeType })}>
                <option value="Auto">Auto-detect</option><option>Stable</option><option>Unstable</option>
              </select>
            </Field>
          </div>
        </Card>
      </div>
      </fieldset>

      <Card className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-base text-muted-foreground">{s.consent ? "Your data stays in this browser. You can delete it any time from the top bar." : t("consentGate")}</p>
        <button disabled={!canAnalyse} onClick={() => nav({ to: "/dashboard" })} className="rounded-full bg-accent px-6 py-3 text-lg font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50">
          {t("analyse")} →
        </button>
      </Card>
      {!canAnalyse && <p className="-mt-5 text-sm text-muted-foreground">{!s.consent ? "Please give consent in the Privacy Notice above to continue." : "Add at least 2 months of data (or load demo data)."}</p>}
    </div>
  );
}

function Field({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center text-sm font-medium">{label}<Help label={label} text={help} /></span>
      {children}
    </label>
  );
}

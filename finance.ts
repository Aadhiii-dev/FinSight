// Pure financial calculation & simulation functions for Finsight.

export type MonthRow = {
  month: string; // e.g. "2025-01"
  income: number;
  essential_expenses: number;
  other_expenses: number;
};

export type CityTier = "Metro" | "Tier 2" | "Tier 3";
export type IncomeType = "Auto" | "Stable" | "Unstable";
export type Stability = "Stable" | "Moderate" | "Unstable";

export type Profile = {
  currentSavings: number;
  insuranceCover: number;
  dependents: number;
  cityTier: CityTier;
  incomeType: IncomeType;
};

export const formatINR = (n: number) =>
  "₹" + Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-IN");

export const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
export const stdDev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
};
export const percentile = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo]! + (s[hi]! - s[lo]!) * (idx - lo);
};

export function stabilityFromCV(cv: number): Stability {
  if (cv < 0.15) return "Stable";
  if (cv <= 0.25) return "Moderate";
  return "Unstable";
}

export function summarize(rows: MonthRow[], profile: Profile) {
  const incomes = rows.map((r) => r.income);
  const expenses = rows.map((r) => r.essential_expenses + r.other_expenses);
  const avgIncome = mean(incomes);
  const avgExpenses = mean(expenses);
  const avgEssential = mean(rows.map((r) => r.essential_expenses));
  const avgOther = mean(rows.map((r) => r.other_expenses));
  const avgSavings = avgIncome - avgExpenses;
  const savingsRate = avgIncome > 0 ? avgSavings / avgIncome : 0;
  const cv = avgIncome > 0 ? stdDev(incomes) / avgIncome : 0;
  const detected = stabilityFromCV(cv);
  const stability: Stability =
    profile.incomeType === "Stable" ? "Stable" : profile.incomeType === "Unstable" ? "Unstable" : detected;
  return { avgIncome, avgExpenses, avgEssential, avgOther, avgSavings, savingsRate, cv, detected, stability };
}

export const recommendedCover = (dependents: number) => 500000 + 300000 * Math.max(0, dependents);

/** Default emergency target for dashboard: major surgery out-of-pocket + buffer months of essentials. */
export function defaultTargetFund(avgEssential: number, stability: Stability, insurance: number) {
  const bufferMonths = stability === "Stable" ? 3 : 6;
  const oop = Math.max(0, 300000 - insurance);
  return { target: oop + bufferMonths * avgEssential, bufferMonths, oop };
}

export function readinessScore(args: {
  currentSavings: number;
  targetFund: number;
  savingsRate: number;
  stability: Stability;
  insuranceCover: number;
  recommendedCover: number;
}) {
  const stabilityScore = args.stability === "Stable" ? 1 : args.stability === "Moderate" ? 0.6 : 0.3;
  const a = Math.min(1, args.targetFund > 0 ? args.currentSavings / args.targetFund : 1);
  const b = Math.min(1, Math.max(0, args.savingsRate) / 0.2);
  const c = stabilityScore;
  const d = Math.min(1, args.recommendedCover > 0 ? args.insuranceCover / args.recommendedCover : 1);
  const score = Math.round(100 * (0.4 * Math.max(0, a) + 0.25 * b + 0.2 * c + 0.15 * d));
  const label = score <= 40 ? "At risk" : score <= 70 ? "Getting there" : "Well prepared";
  return { score, label, parts: { a, b, c, d, stabilityScore } };
}

// Seeded RNG for reproducible results
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Monte Carlo savings forecast: bootstrap historical months, 1,000 runs × 12 months. */
export function forecastSavings(rows: MonthRow[], startBalance: number, runs = 1000, months = 12, seed = 42) {
  const rand = mulberry32(seed);
  const paths: number[][] = Array.from({ length: months }, () => []);
  if (!rows.length) return [];
  for (let r = 0; r < runs; r++) {
    let bal = startBalance;
    for (let m = 0; m < months; m++) {
      const pick = rows[Math.floor(rand() * rows.length)]!;
      bal += pick.income - pick.essential_expenses - pick.other_expenses;
      paths[m]!.push(bal);
    }
  }
  return paths.map((vals, i) => ({
    month: `M${i + 1}`,
    worst: Math.round(percentile(vals, 0.1)),
    likely: Math.round(percentile(vals, 0.5)),
    best: Math.round(percentile(vals, 0.9)),
  }));
}

// ---------- Demo personas ----------
const MONTHS = (() => {
  const out: string[] = [];
  const d = new Date(2025, 9, 1); // Oct 2025 → Sep 2026
  for (let i = 0; i < 12; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
})();

const build = (inc: number[], ess: number[], oth: number[]): MonthRow[] =>
  MONTHS.map((month, i) => ({ month, income: inc[i]!, essential_expenses: ess[i]!, other_expenses: oth[i]! }));

export type Persona = { id: string; name: string; tagline: string; rows: MonthRow[]; profile: Profile };

export const PERSONAS: Persona[] = [
  {
    id: "priya",
    name: "Priya",
    tagline: "IT employee, stable salary ₹75,000/month",
    rows: build(
      [75000, 75000, 75000, 75000, 75000, 112000, 75000, 75000, 75000, 79000, 79000, 79000],
      [32000, 32500, 33000, 31800, 32200, 33500, 32800, 33000, 34000, 34200, 33800, 34500],
      [14000, 21000, 12500, 16000, 13000, 26000, 15000, 14500, 18000, 13500, 16500, 15000],
    ),
    profile: { currentSavings: 180000, insuranceCover: 500000, dependents: 1, cityTier: "Metro", incomeType: "Auto" },
  },
  {
    id: "ravi",
    name: "Ravi",
    tagline: "Delivery partner, ₹12,000–₹28,000 varying monthly",
    rows: build(
      [18500, 24000, 27500, 21000, 12500, 15000, 22500, 28000, 19000, 13500, 16000, 25500],
      [11500, 11800, 12200, 11600, 11000, 11300, 11900, 12400, 11700, 11200, 11400, 12000],
      [3500, 5200, 6800, 4200, 1500, 2200, 4800, 7200, 3600, 1800, 2400, 5600],
    ),
    profile: { currentSavings: 15000, insuranceCover: 0, dependents: 2, cityTier: "Tier 2", incomeType: "Auto" },
  },
  {
    id: "meena",
    name: "Meena",
    tagline: "Freelance designer, ₹20,000–₹90,000, delayed payments",
    rows: build(
      [42000, 20000, 88000, 35000, 22000, 90000, 51000, 24000, 67000, 30000, 78000, 45000],
      [24000, 23500, 25000, 24500, 23000, 25500, 24800, 23800, 25200, 24200, 25800, 24600],
      [9000, 4500, 22000, 8000, 5000, 24000, 12000, 5500, 16000, 7000, 19000, 10000],
    ),
    profile: { currentSavings: 60000, insuranceCover: 300000, dependents: 0, cityTier: "Metro", incomeType: "Auto" },
  },
];

// ---------- CSV ----------
export function parseCSV(text: string): { rows: MonthRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], errors: ["The file is empty."] };
  const header = lines[0]!.toLowerCase().split(",").map((h) => h.trim());
  const need = ["month", "income", "essential_expenses", "other_expenses"];
  const idx = need.map((n) => header.indexOf(n));
  if (idx.some((i) => i < 0)) return { rows: [], errors: [`Missing columns. Expected: ${need.join(", ")}`] };
  const rows: MonthRow[] = [];
  lines.slice(1, 25).forEach((line, li) => {
    const c = line.split(",").map((x) => x.trim());
    const month = (c[idx[0]!] || "").slice(0, 20);
    const nums = idx.slice(1).map((i) => Number(c[i]));
    const [inc, ess, oth] = nums as [number, number, number];
    if (!month || nums.some((n) => !Number.isFinite(n) || n < 0)) {
      errors.push(`Row ${li + 2} skipped: invalid or negative values.`);
      return;
    }
    rows.push({ month, income: inc, essential_expenses: ess, other_expenses: oth });
  });
  if (lines.length > 25) errors.push("Only the first 24 months were imported.");
  return { rows, errors };
}

// ---------- Emergency planner ----------
export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

export function requiredMonthly(target: number, current: number, annualReturn: number, n: number) {
  const r = monthlyRate(annualReturn);
  const g = Math.pow(1 + r, n);
  const raw = r === 0 ? (target - current) / n : ((target - current * g) * r) / (g - 1);
  return { r, g, raw, value: Math.max(0, raw) };
}

export type PlanInput = {
  cost: number; insurance: number; inflation: number; annualReturn: number;
  bufferMonths: number; avgEssential: number; months: number; currentSavings: number;
};

export function planFund(p: PlanInput) {
  const oop = Math.max(0, p.cost - p.insurance);
  const inflated = oop * Math.pow(1 + p.inflation, p.months / 12);
  const target = inflated + p.bufferMonths * p.avgEssential;
  const req = requiredMonthly(target, p.currentSavings, p.annualReturn, p.months);
  return { oop, inflated, target, ...req };
}

export function minAffordableMonths(p: PlanInput, surplus: number, maxMonths = 120) {
  if (surplus <= 0) return null;
  for (let m = 6; m <= maxMonths; m++) if (planFund({ ...p, months: m }).value <= surplus) return m;
  return null;
}

export function growthPath(current: number, monthly: number, r: number, n: number, target: number) {
  const out = [{ month: 0, balance: Math.round(current), target: Math.round(target) }];
  let b = current;
  for (let m = 1; m <= n; m++) { b = b * (1 + r) + monthly; out.push({ month: m, balance: Math.round(b), target: Math.round(target) }); }
  return out;
}

// ---------- Stress test ----------
export type StressInput = {
  incomeDrop: number; delayProb: number; delayLen: number; medicalCost: number;
  medicalMonth: number; expenseInflation: number; target: number;
};

export function stressTest(rows: MonthRow[], start: number, s: StressInput, runs = 1000, months = 12, seed = 7) {
  const rand = mulberry32(seed);
  const bals: number[][] = Array.from({ length: months }, () => []);
  let ranOut = 0, reached = 0;
  const firstNeg = new Array(months).fill(0) as number[];
  for (let k = 0; k < runs; k++) {
    let bal = start, pending = 0, neg = false, hit = false;
    const delayed: number[] = new Array(months + 4).fill(0);
    for (let m = 0; m < months; m++) {
      const pick = rows[Math.floor(rand() * rows.length)]!;
      let inc = pick.income * (1 - s.incomeDrop);
      if (rand() < s.delayProb) { delayed[m + s.delayLen]! += inc; inc = 0; }
      inc += delayed[m]!; pending = inc;
      const infl = Math.pow(1 + s.expenseInflation, (m + 1) / 12);
      let exp = (pick.essential_expenses + pick.other_expenses) * infl;
      if (m + 1 === s.medicalMonth) exp += s.medicalCost;
      bal += pending - exp;
      bals[m]!.push(bal);
      if (!neg && bal < 0) { neg = true; firstNeg[m]!++; }
      if (bal >= s.target) hit = true;
    }
    if (neg) ranOut++;
    if (hit) reached++;
  }
  const fan = bals.map((v, i) => ({ month: `M${i + 1}`, p10: Math.round(percentile(v, 0.1)), p50: Math.round(percentile(v, 0.5)), p90: Math.round(percentile(v, 0.9)) }));
  const maxIdx = firstNeg.reduce((bi, v, i, a) => (v > a[bi]! ? i : bi), 0);
  return { fan, pRunOut: ranOut / runs, pReach: reached / runs, riskMonth: ranOut ? maxIdx + 1 : null };
}

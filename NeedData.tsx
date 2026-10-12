import { Link } from "@tanstack/react-router";
import { Card } from "./Layout";

export function NeedData() {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-3xl font-semibold">No data yet</h1>
      <p className="mt-3 text-muted-foreground">Load a demo persona or add at least 2 months of your data, and tick the privacy box on Home.</p>
      <Link to="/" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground">Load demo data</Link>
    </Card>
  );
}

export function Slider({ label, value, min, max, step, onChange, display, help }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string; help?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-medium"><span className="flex items-center">{label}{help}</span><b className="tabular-nums text-primary">{display}</b></span>
      <input type="range" className="w-full accent-primary" min={min} max={max} step={step} value={value} aria-valuetext={display} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export const inputCls = "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

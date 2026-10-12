import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Home, LayoutDashboard, LifeBuoy, Activity, ShieldCheck, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT, type Lang, type TKey } from "@/lib/i18n";

const NAV: { to: "/" | "/dashboard" | "/planner" | "/stress-test" | "/compliance"; k: TKey; icon: typeof Home }[] = [
  { to: "/", k: "home", icon: Home },
  { to: "/dashboard", k: "dashboard", icon: LayoutDashboard },
  { to: "/planner", k: "planner", icon: LifeBuoy },
  { to: "/stress-test", k: "stress", icon: Activity },
  { to: "/compliance", k: "compliance", icon: ShieldCheck },
];

export function Layout({ children }: { children: ReactNode }) {
  const { lang, set, clearAll } = useStore();
  const t = useT();
  // IS 17802 / WCAG 3.1.1: tell screen readers which language the page is in.
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-semibold text-primary">Finsight</Link>
          <nav aria-label="Main" className="hidden flex-1 gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:bg-secondary data-[status=active]:text-secondary-foreground"
              >
                {t(n.k)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="lang">Language</label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => set({ lang: e.target.value as Lang })}
              className="rounded-full border bg-card px-3 py-1.5 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </select>
            <button
              onClick={() => { if (confirm("Delete all your data from this browser?")) clearAll(); }}
              className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">{t("deleteAll")}</span>
              <span className="sr-only sm:hidden">{t("deleteAll")}</span>
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground">
          <p>{t("disclaimer")}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/compliance" hash="privacy" className="underline underline-offset-2 hover:text-foreground">{t("privacyLink")}</Link>
            <Link to="/compliance" hash="accessibility" className="underline underline-offset-2 hover:text-foreground">{t("a11yLink")}</Link>
            <Link to="/compliance" className="underline underline-offset-2 hover:text-foreground">{t("compliance")}</Link>
          </p>
        </div>
      </footer>
      <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight text-muted-foreground data-[status=active]:text-primary"
          >
            <n.icon className="h-5 w-5" aria-hidden />
            <span className="text-center">{t(n.k)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border bg-card p-5 shadow-card ${className}`}>{children}</section>;
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted-foreground">This page is coming next. Start with your data on Home and see your Dashboard.</p>
      <Link to="/dashboard" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground">Go to Dashboard</Link>
    </Card>
  );
}

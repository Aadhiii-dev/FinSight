import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * IS 17428 (Data Privacy Assurance) — notice + explicit, un-ticked-by-default consent.
 * Shown BEFORE any income data can be entered. Un-ticking withdraws consent and erases the data.
 */
export function PrivacyConsent() {
  const s = useStore();
  const t = useT();

  const onToggle = (checked: boolean) => {
    if (checked) s.set({ consent: true, consentAt: new Date().toISOString() });
    else s.clearAll(); // withdrawing consent erases everything (keeps language only)
  };

  return (
    <Card className="border-2 border-primary/40" >
      <div id="privacy" className="scroll-mt-24">
        <h2 className="font-display flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> {t("privacyTitle")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("privacyIntro")}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {(["pn1", "pn2", "pn3", "pn4", "pn5"] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-secondary p-4 text-base font-medium text-secondary-foreground">
          <input
            type="checkbox"
            required
            className="mt-1 h-6 w-6 shrink-0 accent-primary"
            checked={s.consent}
            onChange={(e) => onToggle(e.target.checked)}
            aria-describedby="consent-hint"
          />
          <span>{t("consent")}</span>
        </label>
        {!s.consent && (
          <p id="consent-hint" className="mt-2 text-sm text-muted-foreground" role="status">
            {t("consentGate")}
          </p>
        )}
      </div>
    </Card>
  );
}

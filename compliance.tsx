import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Accessibility, FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & Privacy — Finsight" },
      { name: "description", content: "How Finsight aligns with BIS standards IS 17428 (data privacy) and IS 17802 (digital accessibility), with the privacy notice, accessibility statement and model transparency." },
      { property: "og:title", content: "Compliance & Privacy — Finsight" },
      { property: "og:description", content: "BIS standards alignment: data privacy (IS 17428) and digital accessibility (IS 17802)." },
    ],
  }),
  component: Compliance,
});

type Row = { requirement: string; feature: string };

const PRIVACY_ROWS: Row[] = [
  { requirement: "Explicit, informed consent before any personal data is collected", feature: "An un-ticked consent checkbox and a plain-language Privacy Notice appear on the Home page. The data-entry area stays disabled until the box is ticked." },
  { requirement: "Purpose / use limitation", feature: "The notice states that data is used solely to predict the user's financial projections and emergency-fund plan, never for advertising, profiling or sale." },
  { requirement: "Collection limitation (data minimisation)", feature: "Only income, spending, savings, insurance cover, dependents and city tier are asked for. No name, phone number, email, PAN, Aadhaar or bank account details are collected." },
  { requirement: "Security safeguards", feature: "All calculations run inside the browser. No account, no database and no server receives the data. CSV uploads are limited to 200 KB and numeric inputs are validated." },
  { requirement: "Individual participation: access, erasure and withdrawal", feature: "A \"Delete all my data\" button is always visible in the header. Un-ticking the consent box withdraws consent and erases all stored data immediately." },
  { requirement: "Transparency and openness", feature: "This page lists what is stored, where, for how long, and which external resource the page loads." },
];

const A11Y_ROWS: Row[] = [
  { requirement: "Perceivable: text alternatives for non-text content", feature: "Every chart has a descriptive text label for screen readers, plus a \"View this chart as a table\" option that gives the exact numbers." },
  { requirement: "Perceivable: sufficient colour contrast", feature: "Text and interface colours are set to at least 4.5:1 contrast, and input borders to at least 3:1. Charts use a colour-blind-safe palette and different line styles, so colour is never the only signal." },
  { requirement: "Perceivable: readable and resizable text", feature: "Base font size is 17 px, layouts reflow on small screens, and plain language is used with a \"?\" explanation for each financial term." },
  { requirement: "Operable: full keyboard access", feature: "Every control can be reached and used with the keyboard. The tab list supports arrow keys, a \"Skip to main content\" link is provided, and a thick focus outline is always shown." },
  { requirement: "Operable: no time limits or motion hazards", feature: "Nothing times out. Animations are switched off for users who enable \"reduce motion\" in their device settings." },
  { requirement: "Understandable: language and clear messages", feature: "The page language is set to English, Hindi or Tamil to match the selector, so screen readers pronounce text correctly. Forms use visible labels and plain-language messages." },
  { requirement: "Robust: works with assistive technology", feature: "Semantic landmarks, headings, labelled form fields, real tables and ARIA live regions are used so screen readers can follow the page." },
];

function Compliance() {
  const { consent, consentAt, rows } = useStore();
  const t = useT();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("compliance")}</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          Finsight is designed in alignment with two Bureau of Indian Standards (BIS) standards. This page shows each requirement and the feature that addresses it.
          Alignment is a design commitment; Finsight is not a BIS-certified product.
        </p>
      </header>

      <Card>
        <h2 className="text-lg font-semibold">Standards at a glance</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <caption className="sr-only">BIS standards applied in Finsight</caption>
            <thead className="text-sm text-muted-foreground">
              <tr><th scope="col" className="p-2">Standard</th><th scope="col" className="p-2">What it covers</th><th scope="col" className="p-2">Where in Finsight</th></tr>
            </thead>
            <tbody>
              <tr className="border-t align-top"><th scope="row" className="p-2 font-semibold">IS 17428<br /><span className="font-normal text-muted-foreground">Data Privacy Assurance</span></th><td className="p-2">Privacy framework for organisations processing personal data: consent, purpose limitation, collection limitation, security.</td><td className="p-2">Home consent and Privacy Notice, header delete button, this page.</td></tr>
              <tr className="border-t align-top"><th scope="row" className="p-2 font-semibold">IS 17802<br /><span className="font-normal text-muted-foreground">Digital Accessibility for ICT Products</span></th><td className="p-2">Accessibility of digital systems and websites for everyone, including persons with disabilities.</td><td className="p-2">Every page: contrast, keyboard use, chart text alternatives, language, reduced motion.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>

      <section id="privacy" className="scroll-mt-24 space-y-4" aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="font-display flex items-center gap-2 text-2xl font-semibold"><ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Data privacy: IS 17428</h2>
        <Card>
          <h3 className="text-lg font-semibold">{t("privacyTitle")}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {(["pn1", "pn2", "pn3", "pn4", "pn5"] as const).map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            One technical note for full transparency: the page loads its fonts from Google Fonts. That is a normal request for font files and never includes anything you type into Finsight.
          </p>
        </Card>
        <RequirementTable caption="IS 17428 requirements and Finsight features" rows={PRIVACY_ROWS} />
        <Card>
          <h3 className="flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5" aria-hidden /> Your consent status</h3>
          <p className="mt-2">
            {consent
              ? <>Consent given{consentAt ? <> on <time dateTime={consentAt}>{new Date(consentAt).toLocaleString("en-IN")}</time></> : null}. {rows.length} month{rows.length === 1 ? "" : "s"} of data stored in this browser.</>
              : "No consent given, so no data is stored in this browser."}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Trash2 className="h-4 w-4" aria-hidden /> Use &quot;{t("deleteAll")}&quot; in the top bar, or un-tick the consent box on Home, to erase everything.</p>
        </Card>
      </section>

      <section id="accessibility" className="scroll-mt-24 space-y-4" aria-labelledby="a11y-h">
        <h2 id="a11y-h" className="font-display flex items-center gap-2 text-2xl font-semibold"><Accessibility className="h-6 w-6 text-primary" aria-hidden /> Digital accessibility: IS 17802</h2>
        <RequirementTable caption="IS 17802 accessibility requirements and Finsight features" rows={A11Y_ROWS} />
        <Card>
          <h3 className="text-lg font-semibold">Accessibility statement</h3>
          <p className="mt-2">We aim for the WCAG 2.2 Level AA success criteria that accessibility standards such as IS 17802 build on. Known limits: charts are drawn with a charting library, so their visual detail is not exposed to screen readers. That is why each chart has a text summary and a data table. Hindi and Tamil translations cover the main navigation, privacy notice and consent; some detailed explanations are in English only.</p>
        </Card>
      </section>

      <section aria-labelledby="model-h" className="space-y-4">
        <h2 id="model-h" className="font-display text-2xl font-semibold">Model transparency and limitations</h2>
        <Card>
          <ul className="list-disc space-y-2 pl-5">
            <li><b>Monthly saving</b> = (Target fund − current savings grown at the savings return) × r ÷ ((1 + r)<sup>n</sup> − 1), where r is the monthly return and n the number of months.</li>
            <li><b>Target fund</b> = (emergency cost − insurance cover, raised by medical inflation) + buffer months × average essential expenses.</li>
            <li><b>Unstable income</b> is planned against the 25th-percentile month, not the average.</li>
            <li><b>Forecasts and stress tests</b> replay 1,000 scenarios by randomly picking months from your own history. Results are ranges, not promises.</li>
            <li><b>Readiness score</b> = 40% savings vs target + 25% savings rate + 20% income stability + 15% insurance cover.</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">Limitations: estimates depend entirely on the data and assumptions you enter. Emergency costs are illustrative and editable. Finsight is decision support, not financial, medical or insurance advice.</p>
        </Card>
      </section>
    </div>
  );
}

function RequirementTable({ caption, rows }: { caption: string; rows: Row[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-sm text-muted-foreground">
            <tr><th scope="col" className="p-2">Requirement area</th><th scope="col" className="p-2">How Finsight meets it</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.requirement} className="border-t align-top">
                <th scope="row" className="w-2/5 p-2 font-medium">{r.requirement}</th>
                <td className="p-2">{r.feature}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

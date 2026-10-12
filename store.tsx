import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MonthRow, Profile } from "./finance";
import type { Lang } from "./i18n";

type State = {
  rows: MonthRow[];
  profile: Profile;
  consent: boolean;
  consentAt: string | null;
  personaId: string | null;
  lang: Lang;
};

const DEFAULT: State = {
  rows: [],
  profile: { currentSavings: 0, insuranceCover: 0, dependents: 0, cityTier: "Metro", incomeType: "Auto" },
  consent: false,
  consentAt: null,
  personaId: null,
  lang: "en",
};

const KEY = "finsight-data-v1";

type Ctx = State & {
  set: (patch: Partial<State>) => void;
  setProfile: (patch: Partial<Profile>) => void;
  clearAll: () => void;
  hydrated: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value: Ctx = {
    ...state,
    hydrated,
    set: (patch) => setState((s) => ({ ...s, ...patch })),
    setProfile: (patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
    clearAll: () => {
      localStorage.removeItem(KEY);
      setState((s) => ({ ...DEFAULT, lang: s.lang }));
    },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

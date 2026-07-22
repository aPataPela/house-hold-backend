"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  defaultThemeRegistry,
  type ThemeRegistry,
} from "./theme-registry";
import type { ThemeDefinition, ThemeId } from "./theme-contract";
import { toThemeCssVariables } from "./theme-contract";
import { applyThemeToDocument, clearThemeFromDocument } from "./theme-color-sync";

export type ThemePreference = {
  houseThemeId: ThemeId;
  personalThemeId?: ThemeId | null;
  reducedTransparency?: boolean;
};

export interface ThemeServiceOptions {
  storageKey?: string;
  registry?: ThemeRegistry;
}

export class ThemeService {
  private readonly storageKey: string;
  private readonly registry: ThemeRegistry;

  constructor(options: ThemeServiceOptions = {}) {
    this.storageKey = options.storageKey ?? "shared-household:theme-preference";
    this.registry = options.registry ?? defaultThemeRegistry;
  }

  readPreference(): ThemePreference | null {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ThemePreference;
      if (!this.registry.has(parsed.houseThemeId)) {
        return null;
      }
      if (parsed.personalThemeId && !this.registry.has(parsed.personalThemeId)) {
        return { ...parsed, personalThemeId: null };
      }
      return parsed;
    } catch {
      return null;
    }
  }

  savePreference(preference: ThemePreference): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(preference));
  }

  clearPreference(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(this.storageKey);
  }

  resolveTheme(preference: ThemePreference | null): ThemeDefinition {
    const candidateId = preference?.personalThemeId ?? preference?.houseThemeId ?? "patagonia";
    return this.registry.get(candidateId);
  }

  resolveReducedTransparency(preference: ThemePreference | null): boolean {
    if (typeof window !== "undefined") {
      const reduceQuery = window.matchMedia("(prefers-reduced-transparency: reduce)");
      if (reduceQuery.matches) {
        return true;
      }
    }
    return preference?.reducedTransparency ?? false;
  }
}

export interface ThemeContextValue {
  registry: ThemeRegistry;
  service: ThemeService;
  houseThemeId: ThemeId;
  personalThemeId: ThemeId | null;
  activeThemeId: ThemeId;
  preference: ThemePreference | null;
  theme: ThemeDefinition;
  reducedTransparency: boolean;
  setHouseTheme: (themeId: ThemeId) => void;
  setPersonalTheme: (themeId: ThemeId | null) => void;
  setReducedTransparency: (value: boolean) => void;
  clearPreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  houseThemeId?: ThemeId;
  initialPersonalThemeId?: ThemeId | null;
  reducedTransparency?: boolean;
  registry?: ThemeRegistry;
  storageKey?: string;
  className?: string;
  style?: CSSProperties;
}

export function ThemeProvider({
  children,
  houseThemeId = "patagonia",
  initialPersonalThemeId = null,
  reducedTransparency = false,
  registry = defaultThemeRegistry,
  storageKey,
  className,
  style,
}: ThemeProviderProps) {
  const service = useMemo(
    () => new ThemeService({ registry, storageKey }),
    [registry, storageKey],
  );
  const [preference, setPreference] = useState<ThemePreference | null>({
    houseThemeId,
    personalThemeId: initialPersonalThemeId,
    reducedTransparency,
  });
  const [hydrated, setHydrated] = useState(false);
  const [systemReducedTransparency, setSystemReducedTransparency] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Browser preferences are an external store hydrated before paint. */
  useLayoutEffect(() => {
    const storedPreference = service.readPreference();
    if (storedPreference) {
      setPreference(storedPreference);
    }

    const query = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const updateTransparency = () => setSystemReducedTransparency(query.matches);
    updateTransparency();
    query.addEventListener("change", updateTransparency);
    setHydrated(true);
    return () => query.removeEventListener("change", updateTransparency);
  }, [service]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const theme = service.resolveTheme(preference);
  const themeVariables = useMemo(() => toThemeCssVariables(theme), [theme]);
  const resolvedReducedTransparency = systemReducedTransparency || (preference?.reducedTransparency ?? false);
  const activeThemeId = theme.metadata.id;

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }
    service.savePreference({
      houseThemeId: preference?.houseThemeId ?? houseThemeId,
      personalThemeId: preference?.personalThemeId ?? initialPersonalThemeId ?? null,
      reducedTransparency: preference?.reducedTransparency ?? reducedTransparency,
    });
  }, [houseThemeId, hydrated, initialPersonalThemeId, preference, reducedTransparency, service]);

  useEffect(() => {
    applyThemeToDocument(theme, resolvedReducedTransparency, themeVariables as Record<`--${string}`, string | number>);
    return () => clearThemeFromDocument();
  }, [resolvedReducedTransparency, theme, themeVariables]);

  const value: ThemeContextValue = {
    registry,
    service,
    houseThemeId,
    personalThemeId: preference?.personalThemeId ?? null,
    activeThemeId,
    preference,
    theme,
    reducedTransparency: resolvedReducedTransparency,
    setHouseTheme: (nextThemeId: ThemeId) =>
      setPreference((current) => ({
        houseThemeId: nextThemeId,
        personalThemeId: current?.personalThemeId ?? null,
        reducedTransparency: current?.reducedTransparency ?? false,
      })),
    setPersonalTheme: (nextThemeId: ThemeId | null) =>
      setPreference((current) => ({
        houseThemeId: current?.houseThemeId ?? houseThemeId,
        personalThemeId: nextThemeId,
        reducedTransparency: current?.reducedTransparency ?? false,
      })),
    setReducedTransparency: (nextValue: boolean) =>
      setPreference((current) => ({
        houseThemeId: current?.houseThemeId ?? houseThemeId,
        personalThemeId: current?.personalThemeId ?? null,
        reducedTransparency: nextValue,
      })),
    clearPreference: () => {
      service.clearPreference();
      setPreference({
        houseThemeId,
        personalThemeId: null,
        reducedTransparency,
      });
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={["ds-theme-scope", className].filter(Boolean).join(" ")}
        data-theme={theme.metadata.id}
        data-theme-mode={theme.metadata.mode}
        data-reduced-transparency={resolvedReducedTransparency ? "true" : "false"}
        style={{
          ...themeVariables,
          ...style,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

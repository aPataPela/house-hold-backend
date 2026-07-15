export type ThemeAssetFormat = "svg" | "webp" | "avif" | "png" | "jpg";

export type ThemeAssetLoading = "lazy" | "eager";

export type ThemeAssetPriority = "high" | "low" | "auto";

export interface ThemeAssetResource {
  src: string;
  format?: ThemeAssetFormat;
  width?: number;
  height?: number;
  alt?: string;
  loading?: ThemeAssetLoading;
  fetchPriority?: ThemeAssetPriority;
  preload?: boolean;
}

export type ThemeBackgroundSlot =
  | "appBackground"
  | "authBackground"
  | "onboardingBackground"
  | "homeBackground";

export type ThemeHeroSlot =
  | "onboardingHero"
  | "homeHero"
  | "themePreview";

export type ThemeEmptyStateSlot =
  | "expensesEmpty"
  | "absencesEmpty"
  | "tasksEmpty"
  | "houseEmpty"
  | "rulesEmpty";

export type ThemeDecorativeSlot =
  | "footerDecoration"
  | "headerDecoration"
  | "modalDecoration"
  | "subtlePattern";

export type ThemeIconSlot = "homeIcon";

export type ThemeAssetSlot =
  | ThemeBackgroundSlot
  | ThemeHeroSlot
  | ThemeEmptyStateSlot
  | ThemeDecorativeSlot
  | ThemeIconSlot;

export interface ThemeAssetSlots {
  backgrounds?: Partial<Record<ThemeBackgroundSlot, ThemeAssetResource>>;
  hero?: Partial<Record<ThemeHeroSlot, ThemeAssetResource>>;
  emptyStates?: Partial<Record<ThemeEmptyStateSlot, ThemeAssetResource>>;
  decorative?: Partial<Record<ThemeDecorativeSlot, ThemeAssetResource>>;
  icons?: Partial<Record<ThemeIconSlot, ThemeAssetResource>>;
}

export interface ThemePatternAssets {
  pageBackground: string;
  surfaceTexture: string;
  ornament: string;
}

export interface ThemeIllustrationAssets {
  emptyState: string;
  onboarding: string;
}

export interface ThemeAssets extends ThemeAssetSlots {
  homeIcon: string;
  patterns: ThemePatternAssets;
  illustrations: ThemeIllustrationAssets;
}

export function createThemeAssets(prefix: string): ThemeAssets {
  const homeIcon = `/themes/${prefix}/home-icon.svg`;
  const pageBackground = `/themes/${prefix}/pattern-page.svg`;
  const surfaceTexture = `/themes/${prefix}/pattern-surface.svg`;
  const ornament = `/themes/${prefix}/pattern-ornament.svg`;
  const onboarding = `/themes/${prefix}/illustration-onboarding.svg`;
  const emptyState = `/themes/${prefix}/illustration-empty.svg`;

  return {
    homeIcon,
    patterns: {
      pageBackground,
      surfaceTexture,
      ornament,
    },
    illustrations: {
      emptyState,
      onboarding,
    },
    backgrounds: {
      appBackground: resource(pageBackground, { preload: true }),
      authBackground: resource(surfaceTexture, { preload: true }),
      onboardingBackground: resource(surfaceTexture, { preload: true }),
      homeBackground: resource(pageBackground, { preload: true }),
    },
    hero: {
      onboardingHero: resource(onboarding, { preload: true, alt: "Ilustración de onboarding" }),
      homeHero: resource(emptyState, { preload: true, alt: "Ilustración de estado inicial" }),
      themePreview: resource(homeIcon, { preload: true, width: 96, height: 96, alt: `Vista previa del tema ${prefix}` }),
    },
    emptyStates: {
      expensesEmpty: resource(emptyState, { alt: "Ilustración de gastos vacíos" }),
      absencesEmpty: resource(emptyState, { alt: "Ilustración de ausencias vacías" }),
      tasksEmpty: resource(emptyState, { alt: "Ilustración de tareas vacías" }),
      houseEmpty: resource(emptyState, { alt: "Ilustración de casa vacía" }),
      rulesEmpty: resource(emptyState, { alt: "Ilustración de reglas vacías" }),
    },
    decorative: {
      footerDecoration: resource(ornament),
      headerDecoration: resource(ornament),
      modalDecoration: resource(ornament),
      subtlePattern: resource(surfaceTexture),
    },
    icons: {
      homeIcon: resource(homeIcon, { width: 24, height: 24, alt: "Icono de inicio", preload: true }),
    },
  };
}

export function resource(src: string, options: Partial<ThemeAssetResource> = {}): ThemeAssetResource {
  return {
    src,
    ...options,
  };
}

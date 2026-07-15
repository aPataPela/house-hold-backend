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
  const appBackground = `/themes/${prefix}/appBackground.svg`;
  const authBackground = `/themes/${prefix}/authBackground.svg`;
  const onboardingHero = `/themes/${prefix}/onboardingHero.svg`;
  const homeHero = `/themes/${prefix}/homeHero.svg`;
  const themePreview = `/themes/${prefix}/themePreview.webp`;
  const footerDecoration = `/themes/${prefix}/footerDecoration.svg`;
  const headerDecoration = `/themes/${prefix}/headerDecoration.svg`;
  const modalDecoration = `/themes/${prefix}/modalDecoration.svg`;
  const subtlePattern = `/themes/${prefix}/subtlePattern.svg`;
  const expensesEmpty = `/themes/${prefix}/expensesEmpty.svg`;
  const absencesEmpty = `/themes/${prefix}/absencesEmpty.svg`;
  const tasksEmpty = `/themes/${prefix}/tasksEmpty.svg`;
  const houseEmpty = `/themes/${prefix}/houseEmpty.svg`;
  const rulesEmpty = `/themes/${prefix}/rulesEmpty.svg`;
  const homeIcon = `/themes/${prefix}/homeIcon.svg`;

  return {
    homeIcon,
    patterns: {
      pageBackground: appBackground,
      surfaceTexture: subtlePattern,
      ornament: footerDecoration,
    },
    illustrations: {
      emptyState: houseEmpty,
      onboarding: onboardingHero,
    },
    backgrounds: {
      appBackground: resource(appBackground, { format: "svg", preload: true }),
      authBackground: resource(authBackground, { format: "svg", preload: true }),
      onboardingBackground: resource(authBackground, { format: "svg", preload: true }),
      homeBackground: resource(appBackground, { format: "svg", preload: true }),
    },
    hero: {
      onboardingHero: resource(onboardingHero, { format: "svg", preload: true, alt: "Ilustración de onboarding" }),
      homeHero: resource(homeHero, { format: "svg", preload: true, alt: "Ilustración de inicio" }),
      themePreview: resource(themePreview, { format: "webp", preload: true, width: 1200, height: 800, alt: `Vista previa del tema ${prefix}` }),
    },
    emptyStates: {
      expensesEmpty: resource(expensesEmpty, { format: "svg", alt: "Ilustración de gastos vacíos" }),
      absencesEmpty: resource(absencesEmpty, { format: "svg", alt: "Ilustración de ausencias vacías" }),
      tasksEmpty: resource(tasksEmpty, { format: "svg", alt: "Ilustración de tareas vacías" }),
      houseEmpty: resource(houseEmpty, { format: "svg", alt: "Ilustración de casa vacía" }),
      rulesEmpty: resource(rulesEmpty, { format: "svg", alt: "Ilustración de reglas vacías" }),
    },
    decorative: {
      footerDecoration: resource(footerDecoration, { format: "svg" }),
      headerDecoration: resource(headerDecoration, { format: "svg" }),
      modalDecoration: resource(modalDecoration, { format: "svg" }),
      subtlePattern: resource(subtlePattern, { format: "svg" }),
    },
    icons: {
      homeIcon: resource(homeIcon, { format: "svg", width: 24, height: 24, alt: "Icono de inicio", preload: true }),
    },
  };
}

export function resource(src: string, options: Partial<ThemeAssetResource> = {}): ThemeAssetResource {
  return {
    src,
    ...options,
  };
}

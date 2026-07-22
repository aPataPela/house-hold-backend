export type ThemeAssetFormat = "svg" | "webp" | "avif" | "png" | "jpg";

export type ThemeAssetLoading = "lazy" | "eager";

export type ThemeAssetPriority = "high" | "low" | "auto";

export type ThemeAssetObjectFit = "cover" | "contain";

export interface ThemeAssetResource {
  src: string;
  format: ThemeAssetFormat;
  width: number;
  height: number;
  alt: string;
  decorative: boolean;
  loading: ThemeAssetLoading;
  fetchPriority: ThemeAssetPriority;
  preload: boolean;
  objectFit: ThemeAssetObjectFit;
  objectPosition: string;
  objectPositionNarrow: string;
}

export type ThemeBackgroundSlot =
  | "appBackground"
  | "authBackground"
  | "onboardingBackground"
  | "homeBackground";

export type ThemeHeroSlot = "onboardingHero" | "homeHero" | "themePreview";

export type ThemeEmptyStateSlot =
  | "expensesEmpty"
  | "absencesEmpty"
  | "tasksEmpty"
  | "houseEmpty"
  | "rulesEmpty";

export type ThemeDecorativeSlot =
  "footerDecoration" | "headerDecoration" | "modalDecoration" | "subtlePattern";

export type ThemeIconSlot = "homeIcon";

export type ThemeAssetSlot =
  | ThemeBackgroundSlot
  | ThemeHeroSlot
  | ThemeEmptyStateSlot
  | ThemeDecorativeSlot
  | ThemeIconSlot;

export interface ThemeAssets {
  backgrounds: Record<ThemeBackgroundSlot, ThemeAssetResource>;
  hero: Record<ThemeHeroSlot, ThemeAssetResource>;
  emptyStates: Record<ThemeEmptyStateSlot, ThemeAssetResource>;
  decorative: Record<ThemeDecorativeSlot, ThemeAssetResource>;
  icons: Record<ThemeIconSlot, ThemeAssetResource>;
  // Compatibility aliases for existing CSS variables. New consumers use semantic slots.
  homeIcon: string;
  patterns: {
    pageBackground: string;
    surfaceTexture: string;
    ornament: string;
  };
  illustrations: {
    emptyState: string;
    onboarding: string;
  };
}

type ThemeAssetThemeId = "patagonia" | "chiloe" | "cordillera" | "san-pedro";

type RasterDimensions = Record<
  | "appBackground"
  | "authBackground"
  | "onboardingHero"
  | "homeHero"
  | "themePreview"
  | "footerDecoration"
  | "subtlePattern"
  | "expensesEmpty"
  | "absencesEmpty"
  | "tasksEmpty"
  | "houseEmpty",
  readonly [width: number, height: number]
>;

const dimensions: Record<ThemeAssetThemeId, RasterDimensions> = {
  patagonia: {
    appBackground: [449, 360],
    authBackground: [226, 360],
    onboardingHero: [368, 360],
    homeHero: [419, 360],
    themePreview: [184, 215],
    footerDecoration: [193, 215],
    subtlePattern: [188, 215],
    expensesEmpty: [197, 215],
    absencesEmpty: [193, 215],
    tasksEmpty: [194, 215],
    houseEmpty: [234, 215],
  },
  chiloe: {
    appBackground: [362, 231],
    authBackground: [290, 231],
    onboardingHero: [311, 231],
    homeHero: [480, 231],
    themePreview: [261, 170],
    footerDecoration: [348, 170],
    subtlePattern: [296, 170],
    expensesEmpty: [309, 170],
    absencesEmpty: [261, 177],
    tasksEmpty: [306, 177],
    houseEmpty: [284, 177],
  },
  cordillera: {
    appBackground: [336, 245],
    authBackground: [293, 245],
    onboardingHero: [400, 245],
    homeHero: [420, 245],
    themePreview: [270, 182],
    footerDecoration: [358, 182],
    subtlePattern: [316, 182],
    expensesEmpty: [295, 182],
    absencesEmpty: [257, 153],
    tasksEmpty: [322, 153],
    houseEmpty: [275, 153],
  },
  "san-pedro": {
    appBackground: [450, 263],
    authBackground: [241, 263],
    onboardingHero: [387, 263],
    homeHero: [361, 263],
    themePreview: [166, 105],
    footerDecoration: [205, 172],
    subtlePattern: [149, 182],
    expensesEmpty: [153, 128],
    absencesEmpty: [155, 128],
    tasksEmpty: [158, 145],
    houseEmpty: [158, 145],
  },
};

const positions: Record<
  ThemeAssetThemeId,
  {
    app: string;
    appNarrow: string;
    auth: string;
    authNarrow: string;
    onboarding: string;
    home: string;
    homeNarrow: string;
  }
> = {
  patagonia: {
    app: "48% 58%",
    appNarrow: "52% 58%",
    auth: "72% 52%",
    authNarrow: "66% 50%",
    onboarding: "50% 55%",
    home: "52% 58%",
    homeNarrow: "56% 58%",
  },
  chiloe: {
    app: "50% 58%",
    appNarrow: "54% 58%",
    auth: "68% 52%",
    authNarrow: "72% 52%",
    onboarding: "50% 55%",
    home: "50% 58%",
    homeNarrow: "54% 58%",
  },
  cordillera: {
    app: "50% 45%",
    appNarrow: "54% 45%",
    auth: "72% 48%",
    authNarrow: "68% 48%",
    onboarding: "50% 50%",
    home: "52% 48%",
    homeNarrow: "56% 48%",
  },
  "san-pedro": {
    app: "52% 58%",
    appNarrow: "58% 58%",
    auth: "62% 48%",
    authNarrow: "68% 48%",
    onboarding: "50% 54%",
    home: "56% 58%",
    homeNarrow: "60% 58%",
  },
};

function createThemeAssets(themeId: ThemeAssetThemeId): ThemeAssets {
  const prefix = `/assets/themes/${themeId}`;
  const size = dimensions[themeId];
  const position = positions[themeId];
  const appBackground = `${prefix}/app-background.webp`;
  const authBackground = `${prefix}/auth-background.webp`;
  const onboardingHero = `${prefix}/onboarding-hero.webp`;
  const homeHero = `${prefix}/home-hero.webp`;
  const themePreview = `${prefix}/theme-preview.webp`;
  const footerDecoration = `${prefix}/footer-decoration.webp`;
  const subtlePattern = `${prefix}/subtle-pattern.webp`;
  const expensesEmpty = `${prefix}/empty-expenses.webp`;
  const absencesEmpty = `${prefix}/empty-absences.webp`;
  const tasksEmpty = `${prefix}/empty-tasks.webp`;
  const houseEmpty = `${prefix}/empty-house.webp`;
  const rulesEmpty = `${prefix}/rules-empty.svg`;
  const headerDecoration = `${prefix}/header-decoration.svg`;
  const modalDecoration = `${prefix}/modal-decoration.svg`;
  const homeIcon = `${prefix}/home-icon.svg`;

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
      appBackground: raster(appBackground, size.appBackground, {
        loading: "eager",
        fetchPriority: "high",
        preload: true,
        objectFit: "cover",
        objectPosition: position.app,
        objectPositionNarrow: position.appNarrow,
      }),
      authBackground: raster(authBackground, size.authBackground, {
        objectFit: "cover",
        objectPosition: position.auth,
        objectPositionNarrow: position.authNarrow,
      }),
      onboardingBackground: raster(appBackground, size.appBackground, {
        objectFit: "cover",
        objectPosition: position.app,
        objectPositionNarrow: position.appNarrow,
      }),
      homeBackground: raster(appBackground, size.appBackground, {
        objectFit: "cover",
        objectPosition: position.app,
        objectPositionNarrow: position.appNarrow,
      }),
    },
    hero: {
      onboardingHero: raster(onboardingHero, size.onboardingHero, {
        alt: "Una casa compartida en el paisaje del tema elegido",
        objectPosition: position.onboarding,
        objectPositionNarrow: position.onboarding,
      }),
      homeHero: raster(homeHero, size.homeHero, {
        decorative: true,
        objectFit: "cover",
        objectPosition: position.home,
        objectPositionNarrow: position.homeNarrow,
      }),
      themePreview: raster(themePreview, size.themePreview, {
        decorative: true,
        objectFit: "cover",
        objectPosition: "center top",
        objectPositionNarrow: "center top",
      }),
    },
    emptyStates: {
      expensesEmpty: raster(expensesEmpty, size.expensesEmpty, {
        decorative: true,
      }),
      absencesEmpty: raster(absencesEmpty, size.absencesEmpty, {
        decorative: true,
      }),
      tasksEmpty: raster(tasksEmpty, size.tasksEmpty, { decorative: true }),
      houseEmpty: raster(houseEmpty, size.houseEmpty, { decorative: true }),
      rulesEmpty: vector(rulesEmpty, [320, 240], { decorative: true }),
    },
    decorative: {
      footerDecoration: raster(footerDecoration, size.footerDecoration, {
        decorative: true,
      }),
      headerDecoration: vector(headerDecoration, [1200, 96], {
        decorative: true,
      }),
      modalDecoration: vector(modalDecoration, [1200, 160], {
        decorative: true,
      }),
      subtlePattern: raster(subtlePattern, size.subtlePattern, {
        decorative: true,
      }),
    },
    icons: {
      homeIcon: vector(homeIcon, [24, 24], {
        alt: "Inicio",
        loading: "eager",
        fetchPriority: "high",
        preload: true,
      }),
    },
  };
}

export const themeAssetsRegistry = {
  patagonia: createThemeAssets("patagonia"),
  chiloe: createThemeAssets("chiloe"),
  cordillera: createThemeAssets("cordillera"),
  "san-pedro": createThemeAssets("san-pedro"),
} satisfies Record<ThemeAssetThemeId, ThemeAssets>;

function raster(
  src: string,
  [width, height]: readonly [number, number],
  options: Partial<ThemeAssetResource> = {},
): ThemeAssetResource {
  return resource(src, "webp", width, height, options);
}

function vector(
  src: string,
  [width, height]: readonly [number, number],
  options: Partial<ThemeAssetResource> = {},
): ThemeAssetResource {
  return resource(src, "svg", width, height, options);
}

function resource(
  src: string,
  format: ThemeAssetFormat,
  width: number,
  height: number,
  options: Partial<ThemeAssetResource>,
): ThemeAssetResource {
  return {
    src,
    format,
    width,
    height,
    alt: "",
    decorative: false,
    loading: "lazy",
    fetchPriority: "auto",
    preload: false,
    objectFit: "contain",
    objectPosition: "center",
    objectPositionNarrow: "center",
    ...options,
  };
}

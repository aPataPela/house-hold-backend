import type {
  ThemeDefinition,
  ThemeId,
  ThemeComponentTokens,
  PrimitiveTokens,
} from "./theme-contract";
import { createThemeAssets } from "./theme-assets";

const primitiveTokens: PrimitiveTokens = {
  color: {
    neutral: {
      0: "#ffffff",
      50: "#f8fafc",
      100: "#eef2f7",
      200: "#dce3ed",
      300: "#c7d0de",
      400: "#9aa8bc",
      500: "#66758c",
      600: "#4e5b72",
      700: "#364154",
      800: "#222b39",
      900: "#121826",
    },
    brand: {
      50: "#eef5ff",
      100: "#d9e7ff",
      200: "#b6ceff",
      300: "#86afff",
      400: "#5a8fff",
      500: "#2f64d0",
      600: "#254fb0",
      700: "#1f3f8b",
      800: "#173062",
      900: "#102145",
    },
    accent: {
      50: "#fff7ea",
      100: "#ffe8bf",
      200: "#ffd28b",
      300: "#ffbb51",
      400: "#ffa12a",
      500: "#f2800c",
      600: "#d96706",
      700: "#ae5104",
      800: "#843d05",
      900: "#5e2c05",
    },
    success: {
      50: "#edfdf4",
      100: "#d2f8e1",
      200: "#a7efc5",
      300: "#71dfa2",
      400: "#37c47a",
      500: "#1ba85f",
      600: "#15854d",
      700: "#136843",
      800: "#0f4f34",
      900: "#0b3925",
    },
    warning: {
      50: "#fff8e5",
      100: "#ffebb5",
      200: "#ffd777",
      300: "#ffc23c",
      400: "#f8a904",
      500: "#d68a03",
      600: "#ad6d02",
      700: "#845101",
      800: "#5f3b01",
      900: "#402800",
    },
    danger: {
      50: "#fff0f1",
      100: "#ffd7db",
      200: "#ffadb6",
      300: "#ff7f8f",
      400: "#ff556a",
      500: "#ea2f4a",
      600: "#c51f36",
      700: "#9f1a2d",
      800: "#731423",
      900: "#50111b",
    },
  },
  spacing: {
    0: "0rem",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  },
  radius: {
    0: "0rem",
    1: "0.5rem",
    2: "0.75rem",
    3: "1rem",
    4: "1.25rem",
    5: "1.5rem",
    pill: "999px",
  },
  typography: {
    family: {
      body: '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif',
      display: '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif',
      mono: '"IBM Plex Mono", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    },
    size: {
      1: "0.75rem",
      2: "0.875rem",
      3: "1rem",
      4: "1.125rem",
      5: "1.25rem",
      6: "1.5rem",
      7: "1.75rem",
      8: "2rem",
    },
    lineHeight: {
      tight: "1.1",
      snug: "1.25",
      normal: "1.5",
      relaxed: "1.65",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 850,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.04em",
      wider: "0.08em",
    },
  },
  blur: {
    0: "0px",
    sm: "8px",
    md: "14px",
    lg: "20px",
  },
  opacity: {
    0: 0,
    10: 0.1,
    20: 0.2,
    40: 0.4,
    60: 0.6,
    80: 0.8,
    100: 1,
  },
  shadows: {
    0: "none",
    1: "0 4px 12px rgb(17 24 39 / 12%)",
    2: "0 12px 24px rgb(17 24 39 / 16%)",
    3: "0 22px 48px rgb(17 24 39 / 20%)",
    4: "0 32px 72px rgb(17 24 39 / 26%)",
  },
  motion: {
    duration: {
      instant: "0ms",
      fast: "120ms",
      normal: "180ms",
      slow: "260ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    },
  },
};

const sharedComponentTokens = (semantic: ThemeDefinition["semanticColors"], glass: ThemeDefinition["glass"]): ThemeComponentTokens => ({
  button: {
    primary: {
      background: semantic.actionPrimary,
      backgroundHover: semantic.actionPrimaryHover,
      text: "#ffffff",
      border: "transparent",
      shadow: "var(--ds-elevation-1)",
    },
    secondary: {
      background: semantic.backgroundSurface,
      backgroundHover: semantic.backgroundElevated,
      text: semantic.textPrimary,
      border: semantic.borderSubtle,
      shadow: "var(--ds-elevation-0)",
    },
    danger: {
      background: semantic.danger,
      backgroundHover: primitiveTokens.color.danger[600],
      text: "#ffffff",
      border: "transparent",
      shadow: "var(--ds-elevation-1)",
    },
  },
  card: {
    background: semantic.backgroundSurface,
    border: semantic.borderSubtle,
    shadow: "var(--ds-elevation-1)",
  },
  input: {
    background: semantic.backgroundSurface,
    backgroundFocus: semantic.backgroundElevated,
    border: semantic.borderSubtle,
    borderFocus: semantic.focusRing,
    text: semantic.textPrimary,
    placeholder: semantic.textSecondary,
  },
  modal: {
    backdrop: "rgb(10 16 26 / 52%)",
    background: semantic.backgroundElevated,
    border: semantic.borderSubtle,
    shadow: "var(--ds-elevation-4)",
  },
  bottomNavigation: {
    background: glass.background,
    border: glass.border,
    itemActive: semantic.actionPrimary,
    itemInactive: semantic.textSecondary,
    indicator: semantic.actionPrimary,
  },
  toast: {
    background: semantic.backgroundElevated,
    text: semantic.textPrimary,
    border: semantic.borderSubtle,
  },
  tabs: {
    background: semantic.backgroundSurface,
    indicator: semantic.actionPrimary,
    textActive: semantic.textPrimary,
    textInactive: semantic.textSecondary,
    border: semantic.borderSubtle,
  },
  skeleton: {
    base: primitiveTokens.color.neutral[200],
    shimmer: primitiveTokens.color.neutral[50],
  },
});

function buildTheme(theme: {
  id: ThemeId;
  label: string;
  primary: string;
  primaryHover: string;
  accent: string;
  accentHover: string;
  surface: string;
  surfaceSoft: string;
  elevated: string;
  page: string;
  glass: string;
  border: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
  glassBorder: string;
  glassFallback: string;
  shadowTint: string;
  assets: ThemeDefinition["assets"];
}): ThemeDefinition {
  const semanticColors: ThemeDefinition["semanticColors"] = {
    backgroundPage: theme.page,
    backgroundSurface: theme.surface,
    backgroundGlass: theme.glass,
    backgroundElevated: theme.elevated,
    textPrimary: theme.text,
    textSecondary: theme.textSecondary,
    borderSubtle: theme.border,
    actionPrimary: theme.primary,
    actionPrimaryHover: theme.primaryHover,
    actionSecondary: theme.accent,
    focusRing: theme.primaryHover,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  const glass = {
    background: theme.glass,
    border: theme.glassBorder,
    blur: primitiveTokens.blur.lg,
    saturation: "130%",
    fallbackBackground: theme.glassFallback,
    fallbackBorder: theme.border,
  };

  return {
    metadata: {
      id: theme.id,
      label: theme.label,
      mode: "light",
      version: 1,
      supportsDarkMode: true,
      supportsReducedMotion: true,
      supportsReducedTransparency: true,
    },
    primitiveTokens,
    semanticColors,
    glass,
    elevation: {
      0: "none",
      1: `0 8px 18px ${theme.shadowTint}22`,
      2: `0 16px 34px ${theme.shadowTint}26`,
      3: `0 24px 52px ${theme.shadowTint}2d`,
      4: `0 36px 80px ${theme.shadowTint}33`,
    },
    typography: {
      display: primitiveTokens.typography.family.display,
      body: primitiveTokens.typography.family.body,
      mono: primitiveTokens.typography.family.mono,
      scale: {
        caption: { size: primitiveTokens.typography.size[1], lineHeight: primitiveTokens.typography.lineHeight.normal, weight: 500 },
        body: { size: primitiveTokens.typography.size[3], lineHeight: primitiveTokens.typography.lineHeight.normal, weight: 400 },
        bodyStrong: { size: primitiveTokens.typography.size[3], lineHeight: primitiveTokens.typography.lineHeight.normal, weight: 600 },
        title: { size: primitiveTokens.typography.size[5], lineHeight: primitiveTokens.typography.lineHeight.snug, weight: 700 },
        headline: { size: primitiveTokens.typography.size[7], lineHeight: primitiveTokens.typography.lineHeight.tight, weight: 750 },
      },
    },
    motion: {
      duration: primitiveTokens.motion.duration,
      easing: {
        standard: primitiveTokens.motion.easing.standard,
        emphasized: primitiveTokens.motion.easing.emphasized,
        decelerate: primitiveTokens.motion.easing.decelerate,
      },
    },
    assets: theme.assets,
    components: sharedComponentTokens(semanticColors, glass),
  };
}

export const themeDefinitions: Record<ThemeId, ThemeDefinition> = {
  patagonia: buildTheme({
    id: "patagonia",
    label: "Patagonia",
    primary: "#2f64d0",
    primaryHover: "#254fb0",
    accent: "#2aa79d",
    accentHover: "#22857d",
    surface: "#f7f9fc",
    surfaceSoft: "#e8edf5",
    elevated: "#ffffff",
    page: "#d7dce5",
    glass: "rgb(247 249 252 / 76%)",
    border: "#b3bfce",
    text: "#1e2434",
    textSecondary: "#5f697b",
    success: "#1ba85f",
    warning: "#d68a03",
    danger: "#ea2f4a",
    glassBorder: "rgb(255 255 255 / 52%)",
    glassFallback: "#eef2f7",
    shadowTint: "#1e2434",
    assets: createThemeAssets("patagonia"),
  }),
  chiloe: buildTheme({
    id: "chiloe",
    label: "Chiloé",
    primary: "#2c7a72",
    primaryHover: "#23645d",
    accent: "#d9844a",
    accentHover: "#b96b34",
    surface: "#f7f4ee",
    surfaceSoft: "#ede5da",
    elevated: "#fffaf4",
    page: "#d8d0c5",
    glass: "rgb(247 244 238 / 78%)",
    border: "#c5b6a4",
    text: "#25313f",
    textSecondary: "#65707c",
    success: "#20785b",
    warning: "#a97719",
    danger: "#c93d4a",
    glassBorder: "rgb(255 250 244 / 48%)",
    glassFallback: "#f2ebe2",
    shadowTint: "#3a2f28",
    assets: createThemeAssets("chiloe"),
  }),
  cordillera: buildTheme({
    id: "cordillera",
    label: "Cordillera",
    primary: "#6e63ff",
    primaryHover: "#594de0",
    accent: "#f27558",
    accentHover: "#d65f43",
    surface: "#f8f7fd",
    surfaceSoft: "#ece9fb",
    elevated: "#ffffff",
    page: "#d8d8e6",
    glass: "rgb(248 247 253 / 78%)",
    border: "#c1c5df",
    text: "#222538",
    textSecondary: "#64687b",
    success: "#18805a",
    warning: "#c98300",
    danger: "#df3150",
    glassBorder: "rgb(255 255 255 / 54%)",
    glassFallback: "#f0effa",
    shadowTint: "#26274a",
    assets: createThemeAssets("cordillera"),
  }),
  "san-pedro": buildTheme({
    id: "san-pedro",
    label: "San Pedro",
    primary: "#c86f2e",
    primaryHover: "#b65e22",
    accent: "#2f7f95",
    accentHover: "#256776",
    surface: "#fdf7ef",
    surfaceSoft: "#f1e4d3",
    elevated: "#fffaf5",
    page: "#e2d2bf",
    glass: "rgb(253 247 239 / 80%)",
    border: "#d0bc9f",
    text: "#34291f",
    textSecondary: "#736151",
    success: "#1f8a66",
    warning: "#c1880e",
    danger: "#cc4d38",
    glassBorder: "rgb(255 250 243 / 50%)",
    glassFallback: "#f8efe1",
    shadowTint: "#5c3c21",
    assets: createThemeAssets("san-pedro"),
  }),
};

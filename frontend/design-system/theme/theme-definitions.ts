import type {
  ThemeDefinition,
  ThemeId,
  ThemeComponentTokens,
  PrimitiveTokens,
  ColorScale,
  DataVisualizationTokens,
} from "./theme-contract";
import { themeAssetsRegistry } from "./theme-assets";

type PaletteInput = {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success?: ColorScale;
  warning?: ColorScale;
  danger?: ColorScale;
};

const basePrimitiveTokens = {
  color: {
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
      950: "#06241a",
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
      950: "#281900",
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
      950: "#330b12",
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
} as const;

function createPrimitiveTokens(palette: PaletteInput): PrimitiveTokens {
  return {
    color: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      neutral: palette.neutral,
      success: palette.success ?? basePrimitiveTokens.color.success,
      warning: palette.warning ?? basePrimitiveTokens.color.warning,
      danger: palette.danger ?? basePrimitiveTokens.color.danger,
    },
    spacing: basePrimitiveTokens.spacing,
    radius: basePrimitiveTokens.radius,
    typography: basePrimitiveTokens.typography,
    blur: basePrimitiveTokens.blur,
    opacity: basePrimitiveTokens.opacity,
    shadows: basePrimitiveTokens.shadows,
    motion: basePrimitiveTokens.motion,
  };
}

const defaultSuccessScale = basePrimitiveTokens.color.success;
const defaultWarningScale = basePrimitiveTokens.color.warning;
const defaultDangerScale = basePrimitiveTokens.color.danger;

const primaryChromaticScale = {
  50: "#eefaf0",
  100: "#d7f0db",
  200: "#b2e0be",
  300: "#83ca9b",
  400: "#5bb076",
  500: "#3f9658",
  600: "#2f7a44",
  700: "#245f35",
  800: "#1b4829",
  900: "#14361f",
  950: "#0d2415",
} as const;

const secondaryMarineScale = {
  50: "#eef8fb",
  100: "#d9edf2",
  200: "#b6dbe4",
  300: "#89c5d2",
  400: "#5eacbf",
  500: "#3a92ac",
  600: "#2e748c",
  700: "#245a6d",
  800: "#1c4654",
  900: "#163641",
  950: "#0f252d",
} as const;

const accentFloridScale = {
  50: "#fff1f4",
  100: "#ffdce6",
  200: "#ffb8cb",
  300: "#ff8dae",
  400: "#f9638e",
  500: "#e83d6f",
  600: "#c9285c",
  700: "#a71f4b",
  800: "#82183a",
  900: "#65122d",
  950: "#430c1e",
} as const;
const patagoniaNeutralScale = {
  50: "#f8faf7",
  100: "#ecf1eb",
  200: "#d9e3d7",
  300: "#beccbc",
  400: "#97a897",
  500: "#748276",
  600: "#5a685d",
  700: "#435043",
  800: "#2d372f",
  900: "#1d241f",
  950: "#111713",
} as const;

const chiloePrimaryScale = {
  50: "#ecfbfb",
  100: "#d3f4f3",
  200: "#abe8e5",
  300: "#79d6d1",
  400: "#45c3bc",
  500: "#20ada5",
  600: "#168b86",
  700: "#126d69",
  800: "#0f5452",
  900: "#0d4040",
  950: "#082c2c",
} as const;

const chiloeSecondaryScale = {
  50: "#eef5ff",
  100: "#d8e7ff",
  200: "#b7cfff",
  300: "#89b0ff",
  400: "#5c8fff",
  500: "#336fe8",
  600: "#2859bf",
  700: "#214596",
  800: "#1a356f",
  900: "#14294e",
  950: "#0f1b34",
} as const;

const chiloeAccentScale = {
  50: "#f7f0ff",
  100: "#ead9ff",
  200: "#d3b3ff",
  300: "#b47dff",
  400: "#9c5af4",
  500: "#7d33d8",
  600: "#6326b0",
  700: "#4e1f89",
  800: "#3c1767",
  900: "#2d1148",
  950: "#1d0b2f",
} as const;

const chiloeNeutralScale = {
  50: "#fcfaf6",
  100: "#f2ede6",
  200: "#e1d7cc",
  300: "#c7b4a5",
  400: "#ab9287",
  500: "#89756c",
  600: "#695b54",
  700: "#4f4440",
  800: "#352e2c",
  900: "#241f1e",
  950: "#171312",
} as const;

const cordilleraPrimaryScale = {
  50: "#eef4fb",
  100: "#dce8f5",
  200: "#c0d1e8",
  300: "#9bb2d2",
  400: "#748bb5",
  500: "#536f95",
  600: "#3f5878",
  700: "#30445d",
  800: "#253549",
  900: "#1b2838",
  950: "#111a24",
} as const;

const cordilleraSecondaryScale = {
  50: "#f5f7f9",
  100: "#e4e8ee",
  200: "#cbd2dc",
  300: "#a8b2c0",
  400: "#808c9b",
  500: "#606d7c",
  600: "#4a5663",
  700: "#38424d",
  800: "#272f37",
  900: "#181e24",
  950: "#0f1318",
} as const;

const cordilleraAccentScale = {
  50: "#fff3eb",
  100: "#ffe0d1",
  200: "#ffbf9f",
  300: "#f99267",
  400: "#e96a43",
  500: "#cf4f2d",
  600: "#a83e25",
  700: "#853220",
  800: "#64261a",
  900: "#4a1d14",
  950: "#30130d",
} as const;

const cordilleraNeutralScale = {
  50: "#f8fafc",
  100: "#edf1f5",
  200: "#d7dee5",
  300: "#b9c3cd",
  400: "#909ca9",
  500: "#6e7a86",
  600: "#55606b",
  700: "#3f4851",
  800: "#2a3138",
  900: "#181d22",
  950: "#0d1013",
} as const;

const sanPedroPrimaryScale = {
  50: "#e9fbfb",
  100: "#ccf5f4",
  200: "#9eebe8",
  300: "#67ddd8",
  400: "#39c6c1",
  500: "#18ada9",
  600: "#138986",
  700: "#0f6765",
  800: "#0c4f4d",
  900: "#0a3b3a",
  950: "#082828",
} as const;

const sanPedroSecondaryScale = {
  50: "#fff3ea",
  100: "#ffdcca",
  200: "#ffc0a2",
  300: "#ffa26e",
  400: "#f67d47",
  500: "#de5f27",
  600: "#b84b1f",
  700: "#913a1a",
  800: "#6d2a15",
  900: "#501e10",
  950: "#34130a",
} as const;

const sanPedroAccentScale = {
  50: "#faf1ff",
  100: "#f0dcff",
  200: "#e2b9ff",
  300: "#cc8cff",
  400: "#b45ef2",
  500: "#9b36db",
  600: "#7c29b2",
  700: "#61208a",
  800: "#4b1968",
  900: "#361244",
  950: "#220b2a",
} as const;

const sanPedroNeutralScale = {
  50: "#fffaf1",
  100: "#f7eddc",
  200: "#ecd9bf",
  300: "#d9bc94",
  400: "#c39a68",
  500: "#9f7746",
  600: "#7d5d36",
  700: "#5e4529",
  800: "#42311d",
  900: "#2b2014",
  950: "#171008",
} as const;

const patagoniaData: DataVisualizationTokens = {
  chartSeries1: "#245f35",
  chartSeries2: "#3a92ac",
  chartSeries3: "#e83d6f",
  chartSeries4: "#2f8f5c",
  chartSeries5: "#a86d13",
  chartNeutral: "#748276",
};

const chiloeData: DataVisualizationTokens = {
  chartSeries1: "#20ada5",
  chartSeries2: "#214596",
  chartSeries3: "#d28a00",
  chartSeries4: "#bf2d43",
  chartSeries5: "#7d33d8",
  chartSeries6: "#1b8c62",
  chartNeutral: "#5b6c6c",
};

const cordilleraData: DataVisualizationTokens = {
  chartSeries1: "#30445d",
  chartSeries2: "#a84a2b",
  chartSeries3: "#b4424d",
  chartSeries4: "#4c7fb5",
  chartSeries5: "#c47d15",
  chartNeutral: "#61707a",
};

const sanPedroData: DataVisualizationTokens = {
  chartSeries1: "#18ada9",
  chartSeries2: "#a14f24",
  chartSeries3: "#b45ef2",
  chartSeries4: "#de5f27",
  chartSeries5: "#c88b10",
  chartNeutral: "#6f5d4c",
};

const sharedComponentTokens = (
  semantic: ThemeDefinition["semanticColors"],
  glass: ThemeDefinition["glass"],
  palette: PaletteInput,
): ThemeComponentTokens => ({
  button: {
    primary: {
      background: semantic.actionPrimary,
      backgroundHover: semantic.actionPrimaryHover,
      text: semantic.textOnPrimary,
      border: "transparent",
      shadow: "var(--ds-elevation-1)",
    },
    secondary: {
      background: semantic.surface,
      backgroundHover: semantic.elevatedSurface,
      text: semantic.textPrimary,
      border: semantic.borderSubtle,
      shadow: "var(--ds-elevation-0)",
    },
    danger: {
      background: semantic.danger,
      backgroundHover: palette.danger?.[600] ?? semantic.danger,
      text: semantic.textOnDanger,
      border: "transparent",
      shadow: "var(--ds-elevation-1)",
    },
  },
  card: {
    background: semantic.surface,
    border: semantic.borderSubtle,
    shadow: "var(--ds-elevation-1)",
  },
  input: {
    background: semantic.surface,
    backgroundFocus: semantic.elevatedSurface,
    border: semantic.borderSubtle,
    borderFocus: semantic.focusRing,
    text: semantic.textPrimary,
    placeholder: semantic.textMuted,
  },
  modal: {
    backdrop: glass.overlay,
    background: semantic.elevatedSurface,
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
    background: semantic.elevatedSurface,
    text: semantic.textPrimary,
    border: semantic.borderSubtle,
  },
  tabs: {
    background: semantic.surface,
    indicator: semantic.actionPrimary,
    textActive: semantic.textPrimary,
    textInactive: semantic.textSecondary,
    border: semantic.borderSubtle,
  },
  skeleton: {
    base: palette.neutral[200],
    shimmer: palette.neutral[50],
  },
});

function buildTheme(theme: {
  id: ThemeId;
  label: string;
  palette: PaletteInput;
  semantic: {
    pageBackground: string;
    surface: string;
    elevatedSurface: string;
    glassSurface: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    actionPrimary: string;
    actionPrimaryHover: string;
    actionSecondary: string;
    borderSubtle: string;
    divider: string;
    focusRing: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  glassTint: string;
  glassOpacity: string;
  glassBorder: string;
  glassShadow: string;
  glassOverlay: string;
  glassBlur: string;
  glassSaturation: string;
  backgroundTreatment: ThemeDefinition["backgroundTreatment"];
  shadowTint: string;
  dataVisualization: DataVisualizationTokens;
  assets: ThemeDefinition["assets"];
}): ThemeDefinition {
  const primitiveTokens = createPrimitiveTokens(theme.palette);
  const semanticColors: ThemeDefinition["semanticColors"] = {
    pageBackground: theme.semantic.pageBackground,
    surface: theme.semantic.surface,
    elevatedSurface: theme.semantic.elevatedSurface,
    glassSurface: theme.semantic.glassSurface,
    textPrimary: theme.semantic.textPrimary,
    textSecondary: theme.semantic.textSecondary,
    textMuted: theme.semantic.textMuted,
    textOnPrimary: "#ffffff",
    textOnDanger: "#ffffff",
    actionPrimary: theme.semantic.actionPrimary,
    actionPrimaryHover: theme.semantic.actionPrimaryHover,
    actionSecondary: theme.semantic.actionSecondary,
    borderSubtle: theme.semantic.borderSubtle,
    divider: theme.semantic.divider,
    focusRing: theme.semantic.focusRing,
    success: theme.semantic.success,
    warning: theme.semantic.warning,
    danger: theme.semantic.danger,
    info: theme.semantic.info,
    backgroundPage: theme.semantic.pageBackground,
    backgroundSurface: theme.semantic.surface,
    backgroundGlass: theme.semantic.glassSurface,
    backgroundElevated: theme.semantic.elevatedSurface,
  };

  const glass = {
    tint: theme.glassTint,
    opacity: theme.glassOpacity,
    background: theme.semantic.glassSurface,
    border: theme.glassBorder,
    shadow: theme.glassShadow,
    overlay: theme.glassOverlay,
    blur: theme.glassBlur,
    saturation: theme.glassSaturation,
    fallbackBackground: theme.semantic.surface,
    fallbackBorder: theme.semantic.borderSubtle,
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
    backgroundTreatment: theme.backgroundTreatment,
    dataVisualization: theme.dataVisualization,
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
        caption: {
          size: primitiveTokens.typography.size[1],
          lineHeight: primitiveTokens.typography.lineHeight.normal,
          weight: 500,
        },
        body: {
          size: primitiveTokens.typography.size[3],
          lineHeight: primitiveTokens.typography.lineHeight.normal,
          weight: 400,
        },
        bodyStrong: {
          size: primitiveTokens.typography.size[3],
          lineHeight: primitiveTokens.typography.lineHeight.normal,
          weight: 600,
        },
        title: {
          size: primitiveTokens.typography.size[5],
          lineHeight: primitiveTokens.typography.lineHeight.snug,
          weight: 700,
        },
        headline: {
          size: primitiveTokens.typography.size[7],
          lineHeight: primitiveTokens.typography.lineHeight.tight,
          weight: 750,
        },
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
    components: sharedComponentTokens(semanticColors, glass, theme.palette),
  };
}

export const themeDefinitions: Record<ThemeId, ThemeDefinition> = {
  patagonia: buildTheme({
    id: "patagonia",
    label: "Patagonia",
    palette: {
      primary: primaryChromaticScale,
      secondary: secondaryMarineScale,
      accent: accentFloridScale,
      neutral: patagoniaNeutralScale,
      success: defaultSuccessScale,
      warning: defaultWarningScale,
      danger: defaultDangerScale,
    },
    semantic: {
      pageBackground: "#e8efe6",
      surface: "#f7faf6",
      elevatedSurface: "#ffffff",
      glassSurface: "rgb(247 250 246 / 82%)",
      textPrimary: "#162018",
      textSecondary: "#4f5d53",
      textMuted: "#62705f",
      actionPrimary: "#2a6340",
      actionPrimaryHover: "#245339",
      actionSecondary: "#2f7280",
      borderSubtle: "#c9d5c5",
      divider: "#dfe7dd",
      focusRing: "#4c9d69",
      success: "#2f8f5c",
      warning: "#a86d13",
      danger: "#bf3a4b",
      info: "#2f6f98",
    },
    glassTint: "rgb(247 250 246 / 82%)",
    glassOpacity: "0.82",
    glassBorder: "rgb(255 255 255 / 56%)",
    glassShadow: "0 18px 40px rgb(20 39 28 / 18%)",
    glassOverlay:
      "linear-gradient(180deg, rgb(255 255 255 / 24%), rgb(255 255 255 / 8%))",
    glassBlur: "18px",
    glassSaturation: "120%",
    backgroundTreatment: {
      overlay:
        "linear-gradient(180deg, rgb(232 239 230 / 30%), rgb(247 250 246 / 84%))",
      heroOverlay:
        "linear-gradient(90deg, rgb(247 250 246 / 94%) 0%, rgb(247 250 246 / 76%) 52%, rgb(247 250 246 / 18%) 100%)",
      imageOpacity: "0.34",
      imageOpacityMedium: "0.5",
      imageOpacityStrong: "0.68",
    },
    shadowTint: "#1e241f",
    dataVisualization: patagoniaData,
    assets: themeAssetsRegistry.patagonia,
  }),
  chiloe: buildTheme({
    id: "chiloe",
    label: "Chiloé",
    palette: {
      primary: chiloePrimaryScale,
      secondary: chiloeSecondaryScale,
      accent: chiloeAccentScale,
      neutral: chiloeNeutralScale,
      success: defaultSuccessScale,
      warning: defaultWarningScale,
      danger: defaultDangerScale,
    },
    semantic: {
      pageBackground: "#eaf7f6",
      surface: "#fffdf8",
      elevatedSurface: "#ffffff",
      glassSurface: "rgb(255 253 248 / 84%)",
      textPrimary: "#142224",
      textSecondary: "#4f6060",
      textMuted: "#5b6c6c",
      actionPrimary: "#126d69",
      actionPrimaryHover: "#0f5b57",
      actionSecondary: "#214596",
      borderSubtle: "#d4e2e0",
      divider: "#e7efee",
      focusRing: "#0f5b57",
      success: "#1b8c62",
      warning: "#d28a00",
      danger: "#bf2d43",
      info: "#2c6ee8",
    },
    glassTint: "rgb(255 253 248 / 84%)",
    glassOpacity: "0.84",
    glassBorder: "rgb(255 255 255 / 54%)",
    glassShadow: "0 18px 40px rgb(16 44 49 / 18%)",
    glassOverlay:
      "linear-gradient(180deg, rgb(255 255 255 / 24%), rgb(255 255 255 / 8%))",
    glassBlur: "18px",
    glassSaturation: "125%",
    backgroundTreatment: {
      overlay:
        "linear-gradient(180deg, rgb(234 247 246 / 26%), rgb(255 253 248 / 86%))",
      heroOverlay:
        "linear-gradient(90deg, rgb(255 253 248 / 94%) 0%, rgb(255 253 248 / 74%) 52%, rgb(234 247 246 / 16%) 100%)",
      imageOpacity: "0.36",
      imageOpacityMedium: "0.52",
      imageOpacityStrong: "0.7",
    },
    shadowTint: "#3a2f28",
    dataVisualization: chiloeData,
    assets: themeAssetsRegistry.chiloe,
  }),
  cordillera: buildTheme({
    id: "cordillera",
    label: "Cordillera",
    palette: {
      primary: cordilleraPrimaryScale,
      secondary: cordilleraSecondaryScale,
      accent: cordilleraAccentScale,
      neutral: cordilleraNeutralScale,
      success: defaultSuccessScale,
      warning: defaultWarningScale,
      danger: defaultDangerScale,
    },
    semantic: {
      pageBackground: "#e9edf2",
      surface: "#f7f8fa",
      elevatedSurface: "#ffffff",
      glassSurface: "rgb(247 248 250 / 84%)",
      textPrimary: "#192029",
      textSecondary: "#55606b",
      textMuted: "#61707a",
      actionPrimary: "#6d2230",
      actionPrimaryHover: "#571b26",
      actionSecondary: "#a84a2b",
      borderSubtle: "#c7ced6",
      divider: "#dde3e9",
      focusRing: "#748bb5",
      success: "#2b8a5b",
      warning: "#c47d15",
      danger: "#b4424d",
      info: "#4c7fb5",
    },
    glassTint: "rgb(247 248 250 / 84%)",
    glassOpacity: "0.86",
    glassBorder: "rgb(255 255 255 / 56%)",
    glassShadow: "0 18px 40px rgb(24 30 36 / 18%)",
    glassOverlay:
      "linear-gradient(180deg, rgb(255 255 255 / 22%), rgb(255 255 255 / 6%))",
    glassBlur: "16px",
    glassSaturation: "110%",
    backgroundTreatment: {
      overlay:
        "linear-gradient(180deg, rgb(233 237 242 / 34%), rgb(247 248 250 / 88%))",
      heroOverlay:
        "linear-gradient(90deg, rgb(247 248 250 / 96%) 0%, rgb(247 248 250 / 78%) 52%, rgb(233 237 242 / 20%) 100%)",
      imageOpacity: "0.32",
      imageOpacityMedium: "0.48",
      imageOpacityStrong: "0.66",
    },
    shadowTint: "#26274a",
    dataVisualization: cordilleraData,
    assets: themeAssetsRegistry.cordillera,
  }),
  "san-pedro": buildTheme({
    id: "san-pedro",
    label: "San Pedro",
    palette: {
      primary: sanPedroPrimaryScale,
      secondary: sanPedroSecondaryScale,
      accent: sanPedroAccentScale,
      neutral: sanPedroNeutralScale,
      success: defaultSuccessScale,
      warning: defaultWarningScale,
      danger: defaultDangerScale,
    },
    semantic: {
      pageBackground: "#fbf1df",
      surface: "#fffaf1",
      elevatedSurface: "#ffffff",
      glassSurface: "rgb(255 250 241 / 86%)",
      textPrimary: "#31251b",
      textSecondary: "#6d5a49",
      textMuted: "#6f5d4c",
      actionPrimary: "#0f6765",
      actionPrimaryHover: "#0c5553",
      actionSecondary: "#a14f24",
      borderSubtle: "#e2cfb6",
      divider: "#ebddc9",
      focusRing: "#0c5553",
      success: "#2f8f61",
      warning: "#c88b10",
      danger: "#be3b2e",
      info: "#2c88b8",
    },
    glassTint: "rgb(255 250 241 / 86%)",
    glassOpacity: "0.86",
    glassBorder: "rgb(255 255 255 / 58%)",
    glassShadow: "0 18px 40px rgb(63 41 26 / 18%)",
    glassOverlay:
      "linear-gradient(180deg, rgb(255 255 255 / 24%), rgb(255 255 255 / 8%))",
    glassBlur: "18px",
    glassSaturation: "115%",
    backgroundTreatment: {
      overlay:
        "linear-gradient(180deg, rgb(251 241 223 / 24%), rgb(255 250 241 / 84%))",
      heroOverlay:
        "linear-gradient(90deg, rgb(255 250 241 / 94%) 0%, rgb(255 250 241 / 72%) 52%, rgb(251 241 223 / 14%) 100%)",
      imageOpacity: "0.38",
      imageOpacityMedium: "0.54",
      imageOpacityStrong: "0.72",
    },
    shadowTint: "#5c3c21",
    dataVisualization: sanPedroData,
    assets: themeAssetsRegistry["san-pedro"],
  }),
};

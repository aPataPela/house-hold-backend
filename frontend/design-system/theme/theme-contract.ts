import type { CSSProperties } from "react";
import type { ThemeAssets } from "./theme-assets";

export type ThemeId = "patagonia" | "chiloe" | "cordillera" | "san-pedro";
export type ThemeMode = "light" | "dark";

export interface ThemeMetadata {
  id: ThemeId;
  label: string;
  mode: ThemeMode;
  version: number;
  supportsDarkMode: boolean;
  supportsReducedMotion: boolean;
  supportsReducedTransparency: boolean;
}

export interface PrimitiveTokens {
  color: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    danger: ColorScale;
  };
  spacing: Record<string, string>;
  radius: Record<string, string>;
  typography: {
    family: {
      body: string;
      display: string;
      mono: string;
    };
    size: Record<string, string>;
    lineHeight: Record<string, string>;
    weight: Record<string, number>;
    letterSpacing: Record<string, string>;
  };
  blur: Record<string, string>;
  opacity: Record<string, number>;
  shadows: Record<string, string>;
  motion: {
    duration: {
      instant: string;
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      standard: string;
      emphasized: string;
      decelerate: string;
    };
  };
}

export interface SemanticColors {
  pageBackground: string;
  surface: string;
  elevatedSurface: string;
  glassSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnDanger: string;
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
  backgroundPage?: string;
  backgroundSurface?: string;
  backgroundGlass?: string;
  backgroundElevated?: string;
}

export interface GlassTokens {
  tint: string;
  opacity: string;
  background: string;
  border: string;
  shadow: string;
  overlay: string;
  blur: string;
  saturation: string;
  fallbackBackground: string;
  fallbackBorder: string;
}

export interface BackgroundTreatmentTokens {
  overlay: string;
  heroOverlay: string;
  imageOpacity: string;
  imageOpacityMedium: string;
  imageOpacityStrong: string;
  decorationOpacity: string;
}

export interface ElevationTokens {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}

export interface TypographyTokens {
  display: string;
  body: string;
  mono: string;
  scale: Record<string, { size: string; lineHeight: string; weight: number }>;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface DataVisualizationTokens {
  chartSeries1: string;
  chartSeries2: string;
  chartSeries3: string;
  chartSeries4: string;
  chartSeries5: string;
  chartSeries6?: string;
  chartNeutral: string;
}

export interface MotionTokens {
  duration: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    standard: string;
    emphasized: string;
    decelerate: string;
  };
}

export interface PatternTokens {
  pageBackground: string;
  surfaceTexture: string;
  ornament: string;
}

export interface IllustrationTokens {
  emptyState: string;
  onboarding: string;
}

export interface ThemeComponentTokens {
  button: {
    primary: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
      shadow: string;
    };
    secondary: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
      shadow: string;
    };
    danger: {
      background: string;
      backgroundHover: string;
      text: string;
      border: string;
      shadow: string;
    };
  };
  card: {
    background: string;
    border: string;
    shadow: string;
  };
  input: {
    background: string;
    backgroundFocus: string;
    border: string;
    borderFocus: string;
    text: string;
    placeholder: string;
  };
  modal: {
    backdrop: string;
    background: string;
    border: string;
    shadow: string;
  };
  bottomNavigation: {
    background: string;
    border: string;
    activeBackground: string;
    itemActive: string;
    itemInactive: string;
    indicator: string;
  };
  toast: {
    background: string;
    text: string;
    border: string;
  };
  tabs: {
    background: string;
    indicator: string;
    textActive: string;
    textInactive: string;
    border: string;
  };
  skeleton: {
    base: string;
    shimmer: string;
  };
}

export interface ThemeDefinition {
  metadata: ThemeMetadata;
  primitiveTokens: PrimitiveTokens;
  semanticColors: SemanticColors;
  glass: GlassTokens;
  backgroundTreatment: BackgroundTreatmentTokens;
  dataVisualization?: DataVisualizationTokens;
  elevation: ElevationTokens;
  typography: TypographyTokens;
  motion: MotionTokens;
  assets: ThemeAssets;
  components: ThemeComponentTokens;
}

export type ThemeVariables = CSSProperties &
  Record<`--${string}`, string | number>;

export function toThemeCssVariables(theme: ThemeDefinition): ThemeVariables {
  const vars: Record<string, string | number> = {
    "--ds-theme-id": theme.metadata.id,
    "--ds-theme-mode": theme.metadata.mode,
    "--ds-home-icon-url": `url("${theme.assets.homeIcon}")`,
    "--ds-pattern-page-background": `url("${theme.assets.patterns.pageBackground}")`,
    "--ds-pattern-surface-texture": `url("${theme.assets.patterns.surfaceTexture}")`,
    "--ds-pattern-ornament": `url("${theme.assets.patterns.ornament}")`,
    "--ds-illustration-empty-state": `url("${theme.assets.illustrations.emptyState}")`,
    "--ds-illustration-onboarding": `url("${theme.assets.illustrations.onboarding}")`,
    "--ds-page-background": theme.semanticColors.pageBackground,
    "--ds-surface": theme.semanticColors.surface,
    "--ds-elevated-surface": theme.semanticColors.elevatedSurface,
    "--ds-glass-surface": theme.semanticColors.glassSurface,
    "--ds-text-muted": theme.semanticColors.textMuted,
    "--ds-text-on-primary": theme.semanticColors.textOnPrimary,
    "--ds-text-on-danger": theme.semanticColors.textOnDanger,
    "--ds-divider": theme.semanticColors.divider,
    "--ds-info": theme.semanticColors.info,
  };

  for (const [group, value] of Object.entries(theme.primitiveTokens.color)) {
    for (const [step, token] of Object.entries(value)) {
      vars[`--ds-color-${group}-${step}`] = token;
    }
  }
  if (theme.primitiveTokens.color.primary) {
    for (const [step, token] of Object.entries(
      theme.primitiveTokens.color.primary,
    )) {
      vars[`--ds-color-brand-${step}`] = token;
    }
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.spacing)) {
    vars[`--ds-space-${step}`] = token;
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.radius)) {
    vars[`--ds-radius-${step}`] = token;
  }

  for (const [name, token] of Object.entries(
    theme.primitiveTokens.typography.family,
  )) {
    vars[`--ds-font-${name}`] = token;
  }
  for (const [step, token] of Object.entries(
    theme.primitiveTokens.typography.size,
  )) {
    vars[`--ds-font-size-${step}`] = token;
  }
  for (const [step, token] of Object.entries(
    theme.primitiveTokens.typography.lineHeight,
  )) {
    vars[`--ds-line-height-${step}`] = token;
  }
  for (const [step, token] of Object.entries(
    theme.primitiveTokens.typography.weight,
  )) {
    vars[`--ds-font-weight-${step}`] = token;
  }
  for (const [step, token] of Object.entries(
    theme.primitiveTokens.typography.letterSpacing,
  )) {
    vars[`--ds-letter-spacing-${step}`] = token;
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.blur)) {
    vars[`--ds-blur-${step}`] = token;
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.opacity)) {
    vars[`--ds-opacity-${step}`] = token;
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.shadows)) {
    vars[`--ds-shadow-${step}`] = token;
  }

  for (const [section, values] of Object.entries(
    theme.primitiveTokens.motion,
  )) {
    for (const [step, token] of Object.entries(values)) {
      vars[`--ds-motion-${section}-${step}`] = token;
    }
  }

  for (const [key, token] of Object.entries(theme.semanticColors)) {
    vars[`--ds-${toKebab(key)}`] = token;
  }
  if (theme.semanticColors.pageBackground) {
    vars["--ds-background-page"] =
      theme.semanticColors.backgroundPage ??
      theme.semanticColors.pageBackground;
    vars["--ds-background-surface"] =
      theme.semanticColors.backgroundSurface ?? theme.semanticColors.surface;
    vars["--ds-background-glass"] =
      theme.semanticColors.backgroundGlass ?? theme.semanticColors.glassSurface;
    vars["--ds-background-elevated"] =
      theme.semanticColors.backgroundElevated ??
      theme.semanticColors.elevatedSurface;
  }

  for (const [key, token] of Object.entries(theme.glass)) {
    vars[`--ds-glass-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.backgroundTreatment)) {
    vars[`--ds-background-treatment-${toKebab(key)}`] = token;
  }
  if (theme.dataVisualization) {
    for (const [key, token] of Object.entries(theme.dataVisualization)) {
      vars[`--ds-${toKebab(key)}`] = token;
    }
  }

  for (const [key, token] of Object.entries(theme.elevation)) {
    vars[`--ds-elevation-${key}`] = token;
  }

  for (const [key, token] of Object.entries(theme.typography)) {
    if (typeof token === "string") {
      vars[`--ds-typography-${toKebab(key)}`] = token;
    }
  }

  for (const [variant, token] of Object.entries(theme.motion.duration)) {
    vars[`--ds-motion-duration-${variant}`] = token;
  }
  for (const [variant, token] of Object.entries(theme.motion.easing)) {
    vars[`--ds-motion-easing-${variant}`] = token;
  }

  for (const [key, token] of Object.entries(theme.components.button.primary)) {
    vars[`--ds-button-primary-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(
    theme.components.button.secondary,
  )) {
    vars[`--ds-button-secondary-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.button.danger)) {
    vars[`--ds-button-danger-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.card)) {
    vars[`--ds-card-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.input)) {
    vars[`--ds-input-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.modal)) {
    vars[`--ds-modal-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(
    theme.components.bottomNavigation,
  )) {
    vars[`--ds-bottom-navigation-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.toast)) {
    vars[`--ds-toast-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.tabs)) {
    vars[`--ds-tabs-${toKebab(key)}`] = token;
  }
  for (const [key, token] of Object.entries(theme.components.skeleton)) {
    vars[`--ds-skeleton-${toKebab(key)}`] = token;
  }

  return vars as ThemeVariables;
}

function toKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

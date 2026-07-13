import type { CSSProperties } from "react";

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
    neutral: Record<string, string>;
    brand: Record<string, string>;
    accent: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    danger: Record<string, string>;
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
  backgroundPage: string;
  backgroundSurface: string;
  backgroundGlass: string;
  backgroundElevated: string;
  textPrimary: string;
  textSecondary: string;
  borderSubtle: string;
  actionPrimary: string;
  actionPrimaryHover: string;
  actionSecondary: string;
  focusRing: string;
  success: string;
  warning: string;
  danger: string;
}

export interface GlassTokens {
  background: string;
  border: string;
  blur: string;
  saturation: string;
  fallbackBackground: string;
  fallbackBorder: string;
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
  elevation: ElevationTokens;
  typography: TypographyTokens;
  motion: MotionTokens;
  patterns: PatternTokens;
  illustrations: IllustrationTokens;
  homeIcon: string;
  components: ThemeComponentTokens;
}

export type ThemeVariables = CSSProperties & Record<`--${string}`, string | number>;

export function toThemeCssVariables(theme: ThemeDefinition): ThemeVariables {
  const vars: Record<string, string | number> = {
    "--ds-theme-id": theme.metadata.id,
    "--ds-theme-mode": theme.metadata.mode,
    "--ds-home-icon-url": `url("${theme.homeIcon}")`,
    "--ds-pattern-page-background": `url("${theme.patterns.pageBackground}")`,
    "--ds-pattern-surface-texture": `url("${theme.patterns.surfaceTexture}")`,
    "--ds-pattern-ornament": `url("${theme.patterns.ornament}")`,
    "--ds-illustration-empty-state": `url("${theme.illustrations.emptyState}")`,
    "--ds-illustration-onboarding": `url("${theme.illustrations.onboarding}")`,
  };

  for (const [group, value] of Object.entries(theme.primitiveTokens.color)) {
    for (const [step, token] of Object.entries(value)) {
      vars[`--ds-color-${group}-${step}`] = token;
    }
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.spacing)) {
    vars[`--ds-space-${step}`] = token;
  }

  for (const [step, token] of Object.entries(theme.primitiveTokens.radius)) {
    vars[`--ds-radius-${step}`] = token;
  }

  for (const [name, token] of Object.entries(theme.primitiveTokens.typography.family)) {
    vars[`--ds-font-${name}`] = token;
  }
  for (const [step, token] of Object.entries(theme.primitiveTokens.typography.size)) {
    vars[`--ds-font-size-${step}`] = token;
  }
  for (const [step, token] of Object.entries(theme.primitiveTokens.typography.lineHeight)) {
    vars[`--ds-line-height-${step}`] = token;
  }
  for (const [step, token] of Object.entries(theme.primitiveTokens.typography.weight)) {
    vars[`--ds-font-weight-${step}`] = token;
  }
  for (const [step, token] of Object.entries(theme.primitiveTokens.typography.letterSpacing)) {
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

  for (const [section, values] of Object.entries(theme.primitiveTokens.motion)) {
    for (const [step, token] of Object.entries(values)) {
      vars[`--ds-motion-${section}-${step}`] = token;
    }
  }

  for (const [key, token] of Object.entries(theme.semanticColors)) {
    vars[`--ds-${toKebab(key)}`] = token;
  }

  for (const [key, token] of Object.entries(theme.glass)) {
    vars[`--ds-glass-${toKebab(key)}`] = token;
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
  for (const [key, token] of Object.entries(theme.components.button.secondary)) {
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
  for (const [key, token] of Object.entries(theme.components.bottomNavigation)) {
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

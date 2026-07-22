import type { ThemeDefinition, ThemeId } from "./theme-contract";
import type {
  ThemeAssetResource,
  ThemeAssetSlot,
  ThemeAssets,
  ThemeBackgroundSlot,
  ThemeDecorativeSlot,
  ThemeEmptyStateSlot,
  ThemeHeroSlot,
} from "./theme-assets";
import { defaultThemeRegistry, type ThemeRegistry } from "./theme-registry";

export type ThemeAssetScope = "thumbnail" | "essential" | "all";

const assetCache = new Map<string, Promise<void>>();

export const requiredThemeAssetSlots: readonly ThemeAssetSlot[] = [
  "appBackground",
  "authBackground",
  "onboardingBackground",
  "homeBackground",
  "onboardingHero",
  "homeHero",
  "themePreview",
  "expensesEmpty",
  "absencesEmpty",
  "tasksEmpty",
  "houseEmpty",
  "rulesEmpty",
  "footerDecoration",
  "headerDecoration",
  "modalDecoration",
  "subtlePattern",
  "homeIcon",
];

export class AssetRegistry {
  constructor(
    private readonly registry: ThemeRegistry = defaultThemeRegistry,
    private readonly fallbackThemeId: ThemeId = "patagonia",
  ) {
    if (process.env.NODE_ENV !== "production") {
      for (const entry of registry.list()) {
        validateThemeAssets(entry.definition);
      }
    }
  }

  resolve(themeId: ThemeId, slot: ThemeAssetSlot): ThemeAssetResource | null {
    const primary = this.registry.get(themeId);
    const fallback = this.registry.get(this.fallbackThemeId);
    return (
      resolveFromTheme(primary, slot) ??
      resolveFromTheme(fallback, slot) ??
      null
    );
  }

  preload(
    themeId: ThemeId,
    scope: AssetScopeInput = "essential",
  ): Promise<void[]> {
    const slots = resolveScope(scope);
    return Promise.all(
      slots.map((slot) => preloadThemeAsset(this.resolve(themeId, slot))),
    );
  }

  preloadThemes(
    themeIds: ThemeId[],
    scope: AssetScopeInput = "thumbnail",
  ): Promise<void[]> {
    return Promise.all(
      themeIds.map((themeId) => this.preload(themeId, scope)),
    ).then((results) => results.flat());
  }
}

export type AssetScopeInput = ThemeAssetScope | ThemeAssetSlot[];

export const defaultAssetRegistry = new AssetRegistry();

export function resolveThemeAsset(
  theme: ThemeDefinition,
  slot: ThemeAssetSlot,
  fallbackTheme?: ThemeDefinition,
): ThemeAssetResource | null {
  return (
    resolveFromTheme(theme, slot) ??
    (fallbackTheme ? resolveFromTheme(fallbackTheme, slot) : null) ??
    null
  );
}

export function preloadThemeAsset(
  asset: ThemeAssetResource | null,
): Promise<void> {
  if (!asset || typeof window === "undefined" || !asset.src) {
    return Promise.resolve();
  }
  const cached = assetCache.get(asset.src);
  if (cached) {
    return cached;
  }
  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error(`Failed to load asset: ${asset.src}`));
    image.decoding = asset.loading === "eager" ? "sync" : "async";
    image.src = asset.src;
  }).catch((error: unknown) => {
    assetCache.delete(asset.src);
    throw error;
  });
  assetCache.set(asset.src, promise);
  return promise;
}

export function resolveThemeAssets(theme: ThemeDefinition): ThemeAssets {
  return theme.assets;
}

export function clearThemeAssetCache(): void {
  assetCache.clear();
}

function resolveScope(scope: AssetScopeInput): ThemeAssetSlot[] {
  if (Array.isArray(scope)) {
    return scope;
  }

  if (scope === "thumbnail") {
    return ["themePreview"];
  }

  if (scope === "all") {
    return [...requiredThemeAssetSlots];
  }

  return ["appBackground", "homeHero", "footerDecoration", "homeIcon"];
}

function resolveFromTheme(
  theme: ThemeDefinition,
  slot: ThemeAssetSlot,
): ThemeAssetResource | null {
  const assets = theme.assets;
  switch (slot) {
    case "appBackground":
    case "authBackground":
    case "onboardingBackground":
    case "homeBackground":
      return assets.backgrounds?.[slot as ThemeBackgroundSlot] ?? null;
    case "onboardingHero":
    case "homeHero":
    case "themePreview":
      return assets.hero?.[slot as ThemeHeroSlot] ?? null;
    case "expensesEmpty":
    case "absencesEmpty":
    case "tasksEmpty":
    case "houseEmpty":
    case "rulesEmpty":
      return assets.emptyStates?.[slot as ThemeEmptyStateSlot] ?? null;
    case "footerDecoration":
    case "headerDecoration":
    case "modalDecoration":
    case "subtlePattern":
      return assets.decorative?.[slot as ThemeDecorativeSlot] ?? null;
    case "homeIcon":
      return assets.icons?.homeIcon ?? resourceFromLegacyIcon(assets.homeIcon);
    default:
      return null;
  }
}

function resourceFromLegacyIcon(src: string): ThemeAssetResource {
  return {
    src,
    format: "svg",
    alt: "Inicio",
    decorative: false,
    width: 24,
    height: 24,
    loading: "eager",
    fetchPriority: "high",
    preload: true,
    objectFit: "contain",
    objectPosition: "center",
    objectPositionNarrow: "center",
  };
}

export function validateThemeAssets(theme: ThemeDefinition): void {
  const missing = requiredThemeAssetSlots.filter(
    (slot) => !resolveFromTheme(theme, slot)?.src,
  );
  if (missing.length > 0) {
    throw new Error(
      `Theme "${theme.metadata.id}" is missing required asset slots: ${missing.join(", ")}`,
    );
  }
}

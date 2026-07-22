"use client";
import Image, { type ImageProps } from "next/image";
import {
  type HTMLAttributes,
  type ReactNode,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "./theme-provider";
import { preloadThemeAsset, resolveThemeAsset } from "./theme-asset-registry";
import type {
  ThemeAssetLoading,
  ThemeAssetPriority,
  ThemeAssetResource,
  ThemeAssetSlot,
} from "./theme-assets";
import type { ThemeDefinition, ThemeId } from "./theme-contract";
import { cx } from "../utils";

export interface ThemeArtworkProps extends HTMLAttributes<HTMLElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  alt?: string;
  decorative?: boolean;
  fallback?: ReactNode;
  loading?: ThemeAssetLoading;
  fetchPriority?: ThemeAssetPriority;
  priority?: boolean;
  caption?: string;
  imgProps?: Omit<
    ImageProps,
    | "src"
    | "alt"
    | "width"
    | "height"
    | "loading"
    | "fetchPriority"
    | "priority"
  >;
}

export function ThemeArtwork({
  slot,
  themeId,
  alt,
  decorative,
  fallback,
  loading,
  fetchPriority,
  priority,
  caption,
  imgProps,
  className,
  style,
  ...props
}: ThemeArtworkProps) {
  const { theme, registry } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? registry.get(themeId) : theme),
    [registry, theme, themeId],
  );
  const candidates = useMemo(
    () =>
      uniqueAssets([
        resolveThemeAsset(sourceTheme, slot),
        resolveThemeAsset(registry.get("patagonia"), slot),
      ]),
    [registry, slot, sourceTheme],
  );
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const asset =
    candidates.find((candidate) => !failedSources.includes(candidate.src)) ??
    null;

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset).catch(() =>
        markFailed(setFailedSources, asset.src),
      );
    }
  }, [asset]);

  const isDecorative = decorative ?? asset?.decorative ?? false;
  const resolvedAlt = isDecorative ? "" : (alt ?? asset?.alt ?? slot);
  const shouldPrioritize = priority ?? asset?.preload ?? false;

  return (
    <figure
      className={cx("ds-theme-artwork", className)}
      data-slot={slot}
      style={assetPositionStyle(asset, style)}
      {...props}
    >
      {asset ? (
        <Image
          {...imgProps}
          src={asset.src}
          alt={resolvedAlt}
          width={asset.width}
          height={asset.height}
          loading={shouldPrioritize ? undefined : (loading ?? asset.loading)}
          fetchPriority={fetchPriority ?? asset.fetchPriority}
          priority={shouldPrioritize}
          style={{
            objectFit: asset.objectFit,
            ...imgProps?.style,
          }}
          onError={() => markFailed(setFailedSources, asset.src)}
        />
      ) : (
        <div
          className="ds-theme-artwork__fallback"
          aria-hidden={isDecorative ? "true" : undefined}
        >
          {fallback ?? (
            <span className="ds-field-hint">
              {isDecorative ? "" : resolvedAlt}
            </span>
          )}
        </div>
      )}
      {caption ? (
        <figcaption className="ds-field-hint">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export interface ThemeBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  overlay?: ReactNode;
  loading?: ThemeAssetLoading;
  fetchPriority?: ThemeAssetPriority;
  intensity?: "subtle" | "medium" | "strong";
  mode?: "ambient" | "hero" | "pattern";
}

export function ThemeBackground({
  slot,
  themeId,
  overlay,
  loading,
  fetchPriority,
  intensity = "subtle",
  mode = "ambient",
  className,
  style,
  ...props
}: ThemeBackgroundProps) {
  const { theme, registry } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? registry.get(themeId) : theme),
    [registry, theme, themeId],
  );
  const candidates = useMemo(
    () =>
      uniqueAssets([
        resolveThemeAsset(sourceTheme, slot),
        resolveThemeAsset(registry.get("patagonia"), slot),
      ]),
    [registry, slot, sourceTheme],
  );
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const asset =
    candidates.find((candidate) => !failedSources.includes(candidate.src)) ??
    null;

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset).catch(() =>
        markFailed(setFailedSources, asset.src),
      );
    }
  }, [asset]);

  if (!asset) {
    return (
      <div
        className={cx(
          "ds-theme-background ds-theme-background--fallback",
          className,
        )}
        data-intensity={intensity}
        data-mode={mode}
        aria-hidden="true"
        style={backgroundStyle(sourceTheme, null, style)}
        {...props}
      >
        {overlay}
      </div>
    );
  }

  return (
    <div
      className={cx("ds-theme-background", className)}
      data-intensity={intensity}
      data-mode={mode}
      data-slot={slot}
      aria-hidden="true"
      style={backgroundStyle(sourceTheme, asset, style)}
      {...props}
    >
      {/* Backgrounds stay as plain images so they remain outside functional layout. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="ds-theme-background__image"
        src={asset.src}
        alt=""
        loading={loading ?? asset.loading ?? "lazy"}
        fetchPriority={fetchPriority ?? asset.fetchPriority}
        decoding="async"
        style={{
          objectFit: asset.objectFit,
        }}
        onError={() => markFailed(setFailedSources, asset.src)}
      />
      {overlay ? (
        <div className="ds-theme-background__overlay">{overlay}</div>
      ) : null}
    </div>
  );
}

function assetPositionStyle(
  asset: ThemeAssetResource | null,
  style?: CSSProperties,
): CSSProperties {
  return {
    "--ds-theme-object-position": asset?.objectPosition ?? "center",
    "--ds-theme-object-position-narrow":
      asset?.objectPositionNarrow ?? asset?.objectPosition ?? "center",
    ...style,
  } as CSSProperties;
}

function backgroundStyle(
  theme: ThemeDefinition,
  asset: ThemeAssetResource | null,
  style?: CSSProperties,
): CSSProperties {
  return {
    ...assetPositionStyle(asset),
    "--ds-background-treatment-overlay": theme.backgroundTreatment.overlay,
    "--ds-background-treatment-hero-overlay":
      theme.backgroundTreatment.heroOverlay,
    "--ds-background-treatment-image-opacity":
      theme.backgroundTreatment.imageOpacity,
    "--ds-background-treatment-image-opacity-medium":
      theme.backgroundTreatment.imageOpacityMedium,
    "--ds-background-treatment-image-opacity-strong":
      theme.backgroundTreatment.imageOpacityStrong,
    ...style,
  } as CSSProperties;
}

export interface ThemeIconProps extends HTMLAttributes<HTMLSpanElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  label?: string;
  decorative?: boolean;
  size?: number;
  state?: "active" | "inactive";
}

export function ThemeIcon({
  slot,
  themeId,
  label,
  decorative = true,
  size = 24,
  state = "inactive",
  className,
  ...props
}: ThemeIconProps) {
  const { theme, registry } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? registry.get(themeId) : theme),
    [registry, theme, themeId],
  );
  const candidates = useMemo(
    () =>
      uniqueAssets([
        resolveThemeAsset(sourceTheme, slot),
        resolveThemeAsset(registry.get("patagonia"), slot),
      ]),
    [registry, slot, sourceTheme],
  );
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const asset =
    candidates.find((candidate) => !failedSources.includes(candidate.src)) ??
    null;

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset).catch(() =>
        markFailed(setFailedSources, asset.src),
      );
    }
  }, [asset]);

  if (!asset) {
    return (
      <span
        className={cx("ds-theme-icon ds-theme-icon--fallback", className)}
        aria-hidden={decorative ? "true" : undefined}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : (label ?? slot)}
        data-state={state}
        style={{ width: size, height: size }}
        {...props}
      />
    );
  }

  return (
    <span
      className={cx("ds-theme-icon", className)}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (label ?? asset.alt ?? slot)}
      data-state={state}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url("${asset.src}")`,
        maskImage: `url("${asset.src}")`,
      }}
      {...props}
    />
  );
}

function uniqueAssets(
  assets: Array<ThemeAssetResource | null>,
): ThemeAssetResource[] {
  const seen = new Set<string>();
  return assets.filter((asset): asset is ThemeAssetResource => {
    if (!asset || seen.has(asset.src)) {
      return false;
    }
    seen.add(asset.src);
    return true;
  });
}

function markFailed(
  setter: Dispatch<SetStateAction<string[]>>,
  src: string,
): void {
  setter((current) => (current.includes(src) ? current : [...current, src]));
}

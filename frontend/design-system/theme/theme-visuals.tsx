"use client";
/* eslint-disable @next/next/no-img-element */

import {
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "./theme-provider";
import { defaultThemeRegistry } from "./theme-registry";
import { preloadThemeAsset, resolveThemeAsset } from "./theme-asset-registry";
import type {
  ThemeAssetLoading,
  ThemeAssetPriority,
  ThemeAssetSlot,
} from "./theme-assets";
import type { ThemeId } from "./theme-contract";
import { cx } from "../utils";

export interface ThemeArtworkProps extends HTMLAttributes<HTMLElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  alt?: string;
  decorative?: boolean;
  fallback?: ReactNode;
  loading?: ThemeAssetLoading;
  fetchPriority?: ThemeAssetPriority;
  caption?: string;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading" | "fetchPriority">;
}

export function ThemeArtwork({
  slot,
  themeId,
  alt,
  decorative = false,
  fallback,
  loading,
  fetchPriority,
  caption,
  imgProps,
  className,
  ...props
}: ThemeArtworkProps) {
  const { theme } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? defaultThemeRegistry.get(themeId) : theme),
    [theme, themeId],
  );
  const asset = useMemo(
    () => resolveThemeAsset(sourceTheme, slot, theme),
    [slot, sourceTheme, theme],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset);
    }
  }, [asset]);

  const resolvedAlt = decorative ? "" : alt ?? asset?.alt ?? slot;
  const shouldRenderImage = asset && failedSrc !== asset.src;

  return (
    <figure className={cx("ds-theme-artwork", className)} {...props}>
      {shouldRenderImage ? (
        <img
          {...imgProps}
          src={asset.src}
          alt={resolvedAlt}
          loading={loading ?? asset.loading ?? "lazy"}
          fetchPriority={fetchPriority ?? asset.fetchPriority}
          decoding="async"
          onError={() => setFailedSrc(asset.src)}
        />
      ) : (
        <div className="ds-theme-artwork__fallback" aria-hidden={decorative ? "true" : undefined}>
          {fallback ?? <span className="ds-field-hint">{decorative ? "" : resolvedAlt}</span>}
        </div>
      )}
      {caption ? <figcaption className="ds-field-hint">{caption}</figcaption> : null}
    </figure>
  );
}

export interface ThemeBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  overlay?: ReactNode;
  loading?: ThemeAssetLoading;
  fetchPriority?: ThemeAssetPriority;
}

export function ThemeBackground({
  slot,
  themeId,
  overlay,
  loading,
  fetchPriority,
  className,
  ...props
}: ThemeBackgroundProps) {
  const { theme } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? defaultThemeRegistry.get(themeId) : theme),
    [theme, themeId],
  );
  const asset = useMemo(
    () => resolveThemeAsset(sourceTheme, slot, theme),
    [slot, sourceTheme, theme],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset);
    }
  }, [asset]);

  if (!asset || failedSrc === asset.src) {
    return (
      <div className={cx("ds-theme-background ds-theme-background--fallback", className)} aria-hidden="true" {...props}>
        {overlay}
      </div>
    );
  }

  return (
    <div className={cx("ds-theme-background", className)} aria-hidden="true" {...props}>
      <img
        className="ds-theme-background__image"
        src={asset.src}
        alt=""
        loading={loading ?? asset.loading ?? "lazy"}
        fetchPriority={fetchPriority ?? asset.fetchPriority}
        decoding="async"
        onError={() => setFailedSrc(asset.src)}
      />
      {overlay ? <div className="ds-theme-background__overlay">{overlay}</div> : null}
    </div>
  );
}

export interface ThemeIconProps extends HTMLAttributes<HTMLSpanElement> {
  slot: ThemeAssetSlot;
  themeId?: ThemeId;
  label?: string;
  decorative?: boolean;
  size?: number;
}

export function ThemeIcon({
  slot,
  themeId,
  label,
  decorative = true,
  size = 24,
  className,
  ...props
}: ThemeIconProps) {
  const { theme } = useTheme();
  const sourceTheme = useMemo(
    () => (themeId ? defaultThemeRegistry.get(themeId) : theme),
    [theme, themeId],
  );
  const asset = useMemo(
    () => resolveThemeAsset(sourceTheme, slot, theme),
    [slot, sourceTheme, theme],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.preload) {
      void preloadThemeAsset(asset);
    }
  }, [asset]);

  if (!asset || failedSrc === asset.src) {
    return (
      <span
        className={cx("ds-theme-icon ds-theme-icon--fallback", className)}
        aria-hidden={decorative ? "true" : undefined}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label ?? asset?.alt ?? slot}
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
      aria-label={decorative ? undefined : label ?? asset.alt ?? slot}
      style={{ width: size, height: size }}
      {...props}
    >
      <img
        src={asset.src}
        alt=""
        aria-hidden="true"
        loading={asset.loading ?? "lazy"}
        fetchPriority={asset.fetchPriority}
        decoding="async"
        onError={() => setFailedSrc(asset.src)}
      />
    </span>
  );
}

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, ThemeArtwork } from "./index";
import {
  clearThemeAssetCache,
  defaultAssetRegistry,
  preloadThemeAsset,
  resolveThemeAsset,
} from "./theme-asset-registry";
import { ThemeRegistry } from "./theme-registry";
import { themeDefinitions } from "./theme-definitions";

describe("theme asset registry", () => {
  const OriginalImage = globalThis.Image;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearThemeAssetCache();
    let created = 0;

    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      decoding = "async";
      private _src = "";

      constructor() {
        created += 1;
      }

      static get created() {
        return created;
      }

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
      }

      get src(): string {
        return this._src;
      }
    }

    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: MockImage,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: OriginalImage,
    });
  });

  it("resolves slots and falls back to the house theme when a slot is missing", () => {
    const fallback = themeDefinitions["patagonia"];
    const missingTheme = new ThemeRegistry([
      {
        themeId: "patagonia",
        definition: {
          ...fallback,
          assets: {
            ...fallback.assets,
            hero: {},
          },
        },
      },
    ]).get("patagonia");

    const resolved = resolveThemeAsset(missingTheme, "homeHero", fallback);

    expect(resolved?.src).toBe(fallback.assets.hero?.homeHero?.src);
  });

  it("preloads each asset src only once", async () => {
    const asset = themeDefinitions.patagonia.assets.hero?.themePreview ?? null;
    expect(asset).toBeTruthy();

    await preloadThemeAsset(asset);
    await preloadThemeAsset(asset);

    expect((globalThis.Image as unknown as { created: number }).created).toBe(1);
  });

  it("renders a visible fallback when an artwork fails to load", () => {
    render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeArtwork
          slot="homeHero"
          alt="Home hero"
          fallback={<span data-testid="fallback">Fallback content</span>}
        />
      </ThemeProvider>,
    );

    const image = screen.getByRole("img", { name: "Home hero" });
    fireEvent.error(image);

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("preloads only the thumbnail asset scope by default", async () => {
    await defaultAssetRegistry.preload("patagonia", "thumbnail");

    expect((globalThis.Image as unknown as { created: number }).created).toBe(1);
  });
});

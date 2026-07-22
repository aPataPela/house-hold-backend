import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "../patterns";
import {
  ThemeProvider,
  ThemeArtwork,
  ThemeBackground,
  ThemeIcon,
} from "./index";
import {
  clearThemeAssetCache,
  defaultAssetRegistry,
  preloadThemeAsset,
  requiredThemeAssetSlots,
  resolveThemeAsset,
  validateThemeAssets,
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
            hero: {} as typeof fallback.assets.hero,
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

    expect((globalThis.Image as unknown as { created: number }).created).toBe(
      1,
    );
  });

  it("renders a visible fallback when an artwork fails to load", () => {
    render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeArtwork
          slot="homeHero"
          alt="Home hero"
          decorative={false}
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

    expect((globalThis.Image as unknown as { created: number }).created).toBe(
      1,
    );
  });

  it("exposes every required slot for all registered themes", () => {
    for (const [themeId, definition] of Object.entries(themeDefinitions)) {
      expect(() => validateThemeAssets(definition)).not.toThrow();
      for (const slot of requiredThemeAssetSlots) {
        const asset = resolveThemeAsset(definition, slot);
        expect(asset?.src).toMatch(new RegExp(`^/assets/themes/${themeId}/`));
        expect(asset?.width).toBeGreaterThan(0);
        expect(asset?.height).toBeGreaterThan(0);
      }
    }
  });

  it("reports missing required slots with a descriptive error", () => {
    const invalidTheme = {
      ...themeDefinitions.patagonia,
      assets: {
        ...themeDefinitions.patagonia.assets,
        hero: {
          ...themeDefinitions.patagonia.assets.hero,
          homeHero: {
            ...themeDefinitions.patagonia.assets.hero.homeHero,
            src: "",
          },
        },
      },
    };

    expect(() => validateThemeAssets(invalidTheme)).toThrow(
      /patagonia.*homeHero/i,
    );
  });

  it("falls back to the default definition for an unknown runtime theme", () => {
    expect(ThemeRegistry.createDefault().get("unknown" as never)).toBe(
      themeDefinitions.patagonia,
    );
  });

  it("keeps backgrounds and decorative artwork outside the accessibility tree", () => {
    const { container } = render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeBackground slot="appBackground" />
        <ThemeArtwork slot="footerDecoration" />
      </ThemeProvider>,
    );

    expect(container.querySelector(".ds-theme-background")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".ds-theme-background img")).toHaveAttribute(
      "alt",
      "",
    );
    expect(container.querySelector(".ds-theme-artwork img")).toHaveAttribute(
      "alt",
      "",
    );
  });

  it("applies theme-owned overlay and responsive crop metadata", () => {
    const { container } = render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeBackground slot="homeHero" themeId="cordillera" mode="hero" />
        <ThemeArtwork slot="themePreview" themeId="san-pedro" decorative />
      </ThemeProvider>,
    );

    const background = container.querySelector(".ds-theme-background");
    const preview = container.querySelector('[data-slot="themePreview"]');
    const previewImage = preview?.querySelector("img");

    expect(background).toHaveAttribute("data-mode", "hero");
    expect(background?.getAttribute("style")).toContain(
      themeDefinitions.cordillera.backgroundTreatment.heroOverlay,
    );
    expect(preview?.getAttribute("style")).toContain(
      "--ds-theme-object-position-narrow: center top",
    );
    expect(previewImage).toHaveAttribute("width", "166");
    expect(previewImage).toHaveAttribute("height", "105");
  });

  it("renders the themed Home SVG as a current-color mask with parent-controlled semantics", () => {
    render(
      <ThemeProvider houseThemeId="chiloe">
        <ThemeIcon
          slot="homeIcon"
          state="active"
          decorative={false}
          label="Inicio"
        />
      </ThemeProvider>,
    );

    const icon = screen.getByRole("img", { name: "Inicio" });
    expect(icon).toHaveAttribute("data-state", "active");
    expect(icon.getAttribute("style")).toContain("home-icon.svg");
  });

  it("composes semantic empty-state artwork without replacing its text", () => {
    render(
      <ThemeProvider houseThemeId="cordillera">
        <EmptyState
          artworkSlot="expensesEmpty"
          title="Sin gastos"
          description="Aún no hay movimientos."
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Sin gastos")).toBeVisible();
    expect(screen.getByText("Aún no hay movimientos.")).toBeVisible();
    expect(
      document.querySelector('img[src*="empty-expenses.webp"]'),
    ).toHaveAttribute("alt", "");
  });
});

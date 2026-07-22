# Adding a theme

Adding a fifth theme is a registry operation; features remain unchanged.

1. Add the new technical slug to `ThemeId`.
2. Create `public/assets/themes/<slug>/` with every filename listed in the inventory.
3. Add intrinsic dimensions, desktop/narrow focal points and one
   `createThemeAssets` entry to `theme-assets.ts`, then expose it in
   `themeAssetsRegistry`.
4. Add palette, glass, background-treatment and component tokens to
   `theme-definitions.ts`.
5. Run `npm run assets:inventory`, `npm run assets:check`, unit tests and visual stories.

Conceptual registration:

```ts
export const themeAssetsRegistry = {
  ...existingThemes,
  litoral: createThemeAssets("litoral"),
} satisfies Record<ThemeId, ThemeAssets>;
```

Features continue to request only semantic resources:

```tsx
<ThemeArtwork slot="homeHero" decorative />
<EmptyState artworkSlot="expensesEmpty" title="Sin gastos" />
```

Never add `if (theme === ...)`, concatenate public paths in features, put labels inside
images, or use raster exports as SVG. To replace an asset, preserve its canonical name,
update dimensions if needed, regenerate the manifest and run visual regression.

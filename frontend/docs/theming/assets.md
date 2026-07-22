# Theme assets

Casa Viva resolves visual resources by semantic slot. Runtime files live in
`public/assets/themes/<theme-id>/`; features never import a theme directory or build
asset paths.

The canonical runtime package contains WebP illustrations/backgrounds and one
`currentColor` Home SVG per theme. PNG source exports are intentionally excluded.
Reference boards live in `docs/design/theme-boards/` and are not served by Next.js.

The original San Pedro preview and empty-state exports contained embedded labels
and neighboring board fragments. Documentation copies live in
`docs/design/source/san-pedro-runtime-originals/`; the runtime WebPs are normalized
text-free crops from the same approved artwork.

Run `npm run assets:inventory` after replacing a file and commit the generated
`public/assets/themes/manifest.json`. CI and local verification can use
`npm run assets:check`.

## Recommended limits

| Asset | Format | Suggested dimensions | Maximum target weight |
|---|---|---:|---:|
| App/auth background | WebP | 1200×900 or larger | 180 KB |
| Onboarding/home hero | WebP or SVG | 800×600 | 140 KB |
| Theme preview | WebP | 480×320 | 50 KB |
| Empty state | WebP or SVG | 480×360 | 70 KB |
| Decoration/pattern | WebP or SVG | slot dependent | 50 KB |
| Home icon | SVG | 24×24 viewBox | 4 KB |

The current approved raster exports are smaller than these recommendations. Keep
them behind semantic overlays or contained surfaces, and do not treat them as
information-bearing full-screen images.

## Provenance

The assets come from `casa_viva_all_theme_packs`. Its README files declare them
self-authored exports from the approved Casa Viva boards, with no external visual
sources. The package SVGs are the only vector Home resources.

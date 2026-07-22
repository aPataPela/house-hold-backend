# Theme asset performance

Only `appBackground`, `homeIcon`, the artwork currently above the fold and the
visible footer decoration are eager for the active screen. The theme picker loads
the four `themePreview` thumbnails; it does not load complete packs.

When a user previews a theme, the registry preloads `appBackground`, `homeHero`,
`footerDecoration`, and `homeIcon`. Confirmation applies tokens and assets only after
those requests succeed. A failed preload leaves the previous theme active.

All foreground raster artwork has intrinsic width and height to reserve layout.
`ThemeArtwork` uses `next/image`; ambient backgrounds remain plain absolute images so
they stay outside functional layout and hit testing. Static public URLs use stable
names and Next/static hosting cache semantics.

Do not add global preloads or import complete theme directories. Check the generated
manifest when evaluating request count and transfer size.

When replacing a stable public URL, increment the Casa Viva service-worker cache
version so previously installed clients do not retain an obsolete crop.

# Theme asset accessibility

Decorative artwork uses empty alternative text, `aria-hidden`, no focus behavior and
`pointer-events: none` where it is ambient. Informative artwork receives a short alt
that does not duplicate adjacent copy.

Empty-state titles, descriptions and actions remain DOM text. Their illustration is
never the only explanation. Theme previews keep visible names and native radio
controls. The Home icon is decorative inside a navigation button whose accessible
name is `Inicio`; active navigation uses `aria-current="page"`.

Runtime raster assets must not contain labels, actions, amounts or instructions.
Source exports that contain board annotations remain documentation-only and require
a text-free normalized crop before entering `public/`.

Text never depends on image contrast. Backgrounds have a token-based legibility
overlay and content sits on regular, elevated or glass surfaces. Reduced transparency
disables UI blur while retaining opaque surface fallbacks; reduced motion disables
theme transitions and loading animation.

Before release verify keyboard order, screen-reader names, 320 px viewport, 200% zoom,
landscape, reduced motion, reduced transparency and WCAG AA contrast for every theme.

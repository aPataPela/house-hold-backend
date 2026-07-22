# Asset slots

| Slot | Intended consumer | Default behavior | Fallback |
|---|---|---|---|
| `appBackground` | AppShell/loading | decorative, cover, eager | themed page color |
| `authBackground` | Authentication | decorative, cover | opaque auth surface |
| `onboardingBackground` | Onboarding shell | aliases app ambience | opaque setup surface |
| `homeBackground` | Optional Home ambience | aliases app artwork | page background |
| `onboardingHero` | Setup flow | informative, contain, priority while visible | omitted |
| `homeHero` | Home summary | decorative, cover, eager while Home is visible | omitted |
| `themePreview` | Theme picker | thumbnail only | text card |
| `expensesEmpty` | Expense empty states | decorative, contain, lazy | generic icon |
| `absencesEmpty` | Absence empty states | decorative, contain, lazy | generic icon |
| `tasksEmpty` | Task empty states | decorative, contain, lazy | generic icon |
| `houseEmpty` | Household empty states | decorative, contain, lazy | generic icon |
| `rulesEmpty` | Rules empty states | decorative, contain, lazy | generic icon |
| `footerDecoration` | Bottom navigation | decorative, eager with low fetch priority | omitted |
| `headerDecoration` | Optional themed header | decorative, lazy | omitted |
| `modalDecoration` | Exceptional themed modal | decorative, lazy | omitted |
| `subtlePattern` | Secondary panels | decorative, lazy | plain surface |
| `homeIcon` | Home navigation item | currentColor SVG, eager | neutral Home glyph |

Use `ThemeArtwork` for contained illustrations, `ThemeBackground` for non-interactive
ambient layers, and `ThemeIcon`/`ThemeHomeIcon` for Home. A business feature may
name a semantic slot, but may not supply a theme ID or physical path.

Crop and narrow-viewport focal points belong to `ThemeAssetResource`. Overlay,
image intensity and hero treatment belong to `ThemeDefinition.backgroundTreatment`.

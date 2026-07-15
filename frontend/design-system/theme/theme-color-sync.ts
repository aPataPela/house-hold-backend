import type { ThemeDefinition } from "./theme-contract";

type ThemeCssVariables = Record<`--${string}`, string | number>;

export function applyThemeToDocument(
  theme: ThemeDefinition,
  reducedTransparency: boolean,
  variables: ThemeCssVariables,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, String(value));
  }
  root.dataset.theme = theme.metadata.id;
  root.dataset.themeMode = theme.metadata.mode;
  root.dataset.reducedTransparency = reducedTransparency ? "true" : "false";
  root.style.colorScheme = theme.metadata.mode;
  syncThemeColorMeta(theme.semanticColors.backgroundPage);
}

export function clearThemeFromDocument(): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  delete root.dataset.theme;
  delete root.dataset.themeMode;
  delete root.dataset.reducedTransparency;
}

export function syncThemeColorMeta(color: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const meta =
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
    createThemeColorMeta();
  meta.content = color;
}

function createThemeColorMeta(): HTMLMetaElement {
  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  document.head.appendChild(meta);
  return meta;
}

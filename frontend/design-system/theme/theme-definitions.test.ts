import { describe, expect, it } from "vitest";
import { themeDefinitions } from "./theme-definitions";

describe("theme definitions", () => {
  it("keeps text and primary/danger combinations above AA contrast", () => {
    for (const theme of Object.values(themeDefinitions)) {
      expect(contrast(theme.semanticColors.textPrimary, theme.semanticColors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.semanticColors.textOnPrimary, theme.semanticColors.actionPrimary)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.semanticColors.textOnDanger, theme.semanticColors.danger)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.semanticColors.focusRing, theme.semanticColors.surface)).toBeGreaterThanOrEqual(3);
      expect(theme.semanticColors.pageBackground).toBeTruthy();
      expect(theme.dataVisualization?.chartSeries1 ?? "").toBeTruthy();
    }
  });
});

function contrast(foreground: string, background: string): number {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  const luminance = (value: [number, number, number]) => {
    const channels = value.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const fgLuminance = luminance(fg);
  const bgLuminance = luminance(bg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color: string): [number, number, number] {
  const hex = color.trim().replace("#", "");
  if (hex.startsWith("rgb")) {
    const values = hex
      .replace(/rgba?\(|\)|\s/g, "")
      .split(",")
      .slice(0, 3)
      .map((value) => Number.parseFloat(value));
    return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
  }
  const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

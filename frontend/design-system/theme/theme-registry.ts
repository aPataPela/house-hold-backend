import { themeDefinitions } from "./theme-definitions";
import type { ThemeDefinition, ThemeId } from "./theme-contract";

export interface ThemeRegistryEntry {
  themeId: ThemeId;
  definition: ThemeDefinition;
}

export class ThemeRegistry {
  constructor(private readonly entries: ThemeRegistryEntry[]) {}

  static createDefault(): ThemeRegistry {
    return new ThemeRegistry(
      Object.entries(themeDefinitions).map(([themeId, definition]) => ({
        themeId: themeId as ThemeId,
        definition,
      })),
    );
  }

  list(): ThemeRegistryEntry[] {
    return [...this.entries];
  }

  get(themeId: ThemeId): ThemeDefinition {
    const entry = this.entries.find((candidate) => candidate.themeId === themeId);
    if (!entry) {
      return this.entries[0]?.definition ?? themeDefinitions.patagonia;
    }
    return entry.definition;
  }

  has(themeId: ThemeId): boolean {
    return this.entries.some((entry) => entry.themeId === themeId);
  }

  resolve(options: { houseThemeId?: ThemeId; personalThemeId?: ThemeId | null }): ThemeDefinition {
    const candidateId = options.personalThemeId ?? options.houseThemeId ?? this.entries[0]?.themeId ?? "patagonia";
    return this.get(candidateId);
  }
}

export const defaultThemeRegistry = ThemeRegistry.createDefault();

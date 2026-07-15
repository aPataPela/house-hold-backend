"use client";

import { Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../primitives";
import { defaultThemeRegistry } from "./theme-registry";
import { useTheme } from "./theme-provider";
import type { ThemeId } from "./theme-contract";

export function ThemeSwitcher() {
  const router = useRouter();
  const { activeThemeId, personalThemeId, theme } = useTheme();

  return (
    <Button
      type="button"
      variant="secondary"
      leadingIcon={<Palette size={16} />}
      onClick={() => router.push("/personalizacion/identidad-visual")}
    >
      {personalThemeId ? theme.metadata.label : `${labelFromThemeId(activeThemeId)}`}
    </Button>
  );
}

function labelFromThemeId(themeId: ThemeId): string {
  return defaultThemeRegistry.get(themeId).metadata.label;
}

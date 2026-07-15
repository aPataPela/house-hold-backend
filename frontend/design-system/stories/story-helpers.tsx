"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../theme";
import type { ThemeId, ThemeRegistry } from "../theme";
import { cx } from "../utils";

export function StoryFrame({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={cx("ds-screen-frame", narrow && "ds-viewport-narrow")}>{children}</div>
  );
}

export function ThemeStory({
  themeId,
  reducedTransparency = false,
  narrow = false,
  registry,
  zoom = 1,
  children,
}: {
  themeId: ThemeId;
  reducedTransparency?: boolean;
  narrow?: boolean;
  registry?: ThemeRegistry;
  zoom?: number;
  children: ReactNode;
}) {
  return (
    <ThemeProvider houseThemeId={themeId} reducedTransparency={reducedTransparency} registry={registry}>
      <div
        style={
          zoom !== 1
            ? {
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
              }
            : undefined
        }
      >
        <StoryFrame narrow={narrow}>{children}</StoryFrame>
      </div>
    </ThemeProvider>
  );
}

export const themeIds: ThemeId[] = ["patagonia", "chiloe", "cordillera", "san-pedro"];

"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../theme";
import type { ThemeId } from "../theme";
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
  children,
}: {
  themeId: ThemeId;
  reducedTransparency?: boolean;
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <ThemeProvider houseThemeId={themeId} reducedTransparency={reducedTransparency}>
      <StoryFrame narrow={narrow}>{children}</StoryFrame>
    </ThemeProvider>
  );
}

export const themeIds: ThemeId[] = ["patagonia", "chiloe", "cordillera", "san-pedro"];


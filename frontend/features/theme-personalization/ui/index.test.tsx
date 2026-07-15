import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/design-system/theme";
import { ThemeIdentityVisualPage } from "./index";

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back,
    push,
  }),
}));

describe("theme identity visual page", () => {
  beforeEach(() => {
    localStorage.clear();
    back.mockClear();
    push.mockClear();
  });

  it("previews changes immediately and only persists after apply", async () => {
    render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeIdentityVisualPage />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(localStorage.getItem("shared-household:theme-preference")).not.toBeNull(),
    );
    const initialPreference = localStorage.getItem("shared-household:theme-preference");

    fireEvent.click(screen.getByRole("radio", { name: /Chiloé/i }));

    expect(screen.getByRole("heading", { name: /Chiloé/i })).toBeTruthy();
    expect(localStorage.getItem("shared-household:theme-preference")).toBe(initialPreference);

    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));

    await waitFor(() =>
      expect(localStorage.getItem("shared-household:theme-preference")).toContain("chiloe"),
    );
  });

  it("cancels without saving and returns to the previous route", async () => {
    render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeIdentityVisualPage />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(localStorage.getItem("shared-household:theme-preference")).not.toBeNull(),
    );
    const initialPreference = localStorage.getItem("shared-household:theme-preference");

    fireEvent.click(screen.getByRole("radio", { name: /Cordillera/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    await waitFor(() => {
      expect(back.mock.calls.length + push.mock.calls.length).toBe(1);
    });

    expect(localStorage.getItem("shared-household:theme-preference")).toBe(initialPreference);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BottomNavigation, FunctionalIcon, ThemeHomeIcon } from "./index";
import { ThemeProvider } from "./theme";

describe("iconography", () => {
  it("renders functional icons with accessible labels when not decorative", () => {
    const { container } = render(
      <FunctionalIcon name="buscar" decorative={false} label="Buscar gasto" />,
    );

    expect(screen.getByRole("img", { name: "Buscar gasto" })).toBeTruthy();
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
  });

  it("keeps functional icons decorative by default", () => {
    const { container } = render(<FunctionalIcon name="gastos" />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders themed home icons with stable state metadata", () => {
    const { container } = render(
      <ThemeProvider houseThemeId="patagonia">
        <ThemeHomeIcon
          themeId="chiloe"
          state="inactive"
          decorative={false}
          label="Inicio"
        />
      </ThemeProvider>,
    );

    const icon = container.querySelector('[data-theme-home-icon="chiloe"]');
    expect(icon).toHaveAttribute("data-theme-home-icon", "chiloe");
    expect(icon).toHaveAttribute("data-state", "inactive");
    expect(screen.getByRole("img", { name: "Inicio" })).toBeTruthy();
  });

  it("exposes the active home icon inside bottom navigation", () => {
    const { container } = render(
      <ThemeProvider houseThemeId="patagonia">
        <BottomNavigation
          value="home"
          onChange={() => undefined}
          items={[
            {
              value: "home",
              label: "Inicio",
              icon: (active) => (
                <ThemeHomeIcon
                  themeId="patagonia"
                  state={active ? "active" : "inactive"}
                />
              ),
            },
            {
              value: "expenses",
              label: "Gastos",
              icon: <FunctionalIcon name="gastos" />,
            },
          ]}
        />
      </ThemeProvider>,
    );

    expect(
      container.querySelector('[data-theme-home-icon="patagonia"]'),
    ).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("button", { name: "Inicio" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Gastos" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

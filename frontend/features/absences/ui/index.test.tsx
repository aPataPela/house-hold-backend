import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/design-system/theme";
import { AbsenceForm, AbsenceList, ConflictMessage } from "./index";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider houseThemeId="patagonia">{ui}</ThemeProvider>);
}

describe("absence ui", () => {
  it("confirms before submitting a new absence", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => true);

    renderWithTheme(
      <AbsenceForm
        members={[
          {
            membershipId: "m1",
            householdId: "h1",
            displayName: "Ana",
            role: "MEMBER",
            livingSince: "2026-01-01",
            status: "ACTIVE",
          },
        ]}
        actor={{ membershipId: "m1", role: "MEMBER" }}
        permissions={{
          canCreateForSelf: true,
          canCreateForOthers: false,
          canCancelOwn: true,
          canCancelOthers: false,
          canSelectOthers: false,
        }}
        settlement={null}
        week={null}
        absences={[]}
        currentMembershipId="m1"
        loading={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /guardar ausencia/i }));
    await user.click(await screen.findByRole("button", { name: /^guardar$/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("shows conflict information when ranges overlap", () => {
    renderWithTheme(
      <ConflictMessage
        conflicts={[
          {
            absenceId: "a1",
            membershipId: "m1",
            periodStart: "2026-07-10",
            periodEnd: "2026-07-12",
            reason: "Viaje",
            overlapDays: 2,
          },
        ]}
        memberName={() => "Ana"}
      />,
    );

    expect(screen.getByText(/conflicto de fechas/i)).toBeInTheDocument();
    expect(screen.getByText(/2 días/i)).toBeInTheDocument();
  });

  it("renders an empty state and cancel action for the list", () => {
    const onCancel = vi.fn();

    const { rerender } = renderWithTheme(
      <AbsenceList
        absences={[]}
        currentMembershipId="m1"
        canCancelOthers={false}
        loading={false}
        memberName={() => "Ana"}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText(/sin ausencias registradas/i)).toBeInTheDocument();

    rerender(
      <ThemeProvider houseThemeId="patagonia">
        <AbsenceList
          absences={[
            {
              absenceId: "a1",
              householdId: "h1",
              membershipId: "m1",
              status: "ACTIVE",
              periodStart: "2026-07-10",
              periodEnd: "2026-07-12",
              reason: "Viaje",
              audit: { createdByMembershipId: "m1", createdAt: "2026-07-01T00:00:00.000Z" },
            },
          ]}
          currentMembershipId="m1"
          canCancelOthers={false}
          loading={false}
          memberName={() => "Ana"}
          onCancel={onCancel}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });
});

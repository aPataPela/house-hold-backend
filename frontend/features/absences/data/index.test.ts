import { describe, expect, it } from "vitest";
import { createFakeAbsencesGateway, mapAbsenceDtoToDomain, mapMemberDtoToDomain } from "./index";

describe("absence data adapters", () => {
  it("maps api models to the local domain", () => {
    expect(
      mapMemberDtoToDomain({
        membershipId: "m1",
        householdId: "h1",
        userId: "ana",
        userName: "Ana",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: "2026-01-01",
        livingSince: "2026-01-01",
      }),
    ).toMatchObject({ displayName: "Ana", status: "ACTIVE" });

    expect(
      mapAbsenceDtoToDomain(
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
        "h1",
      ),
    ).toMatchObject({ householdId: "h1", reason: "Viaje" });
  });

  it("keeps fake repositories in sync through a shared store", async () => {
    const gateway = createFakeAbsencesGateway({
      members: [
        {
          membershipId: "m1",
          householdId: "h1",
          userId: "ana",
          role: "MEMBER",
          status: "ACTIVE",
          joinedAt: "2026-01-01",
          livingSince: "2026-01-01",
        },
      ],
    });

    const created = await gateway.createAbsence("h1", {
      membershipId: "m1",
      periodStart: "2026-07-10",
      periodEnd: "2026-07-12",
      createdByMembershipId: "m1",
    });

    const absences = await gateway.listAbsences("h1", {
      from: "2026-07-01",
      to: "2026-07-31",
    });

    expect(absences).toHaveLength(1);
    expect(absences[0]?.absenceId).toBe(created.absenceId);
  });
});

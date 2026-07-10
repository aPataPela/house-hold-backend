import { describe, expect, it } from "vitest";
import { ParticipationPolicyEngine } from "../src/context/participation/services/participation-policy-engine";

describe("ParticipationPolicyEngine", () => {
  const engine = new ParticipationPolicyEngine();
  const members = [{ id: "m_1" }, { id: "m_2" }, { id: "m_3" }];
  const date = new Date("2026-02-10T00:00:00.000Z");

  it("splits equally when no rules exist", () => {
    expect(
      engine.calculateSplit(3000, {
        members,
        preferences: [],
        date,
      }),
    ).toEqual([
      { membershipId: "m_1", assignedAmount: 1000, weightUsed: 1 },
      { membershipId: "m_2", assignedAmount: 1000, weightUsed: 1 },
      { membershipId: "m_3", assignedAmount: 1000, weightUsed: 1 },
    ]);
  });

  it("applies half participation and zero-weight rules", () => {
    expect(
      engine.calculateSplit(3000, {
        members,
        preferences: [
          {
            membershipId: "m_2",
            mode: "HALF",
            weight: 0.5,
            validFrom: new Date("2026-02-01T00:00:00.000Z"),
          },
          {
            membershipId: "m_3",
            mode: "NO_PARTICIPATES",
            weight: 0,
            validFrom: new Date("2026-02-01T00:00:00.000Z"),
          },
        ],
        date,
      }),
    ).toEqual([
      { membershipId: "m_1", assignedAmount: 2000, weightUsed: 1 },
      { membershipId: "m_2", assignedAmount: 1000, weightUsed: 0.5 },
    ]);
  });

  it("keeps legacy weights working during the transition", () => {
    expect(
      engine.calculateSplit(1000, {
        members: [{ id: "m_1" }, { id: "m_2" }],
        preferences: [
          {
            membershipId: "m_1",
            mode: "INCLUDE_DEFAULT",
            weight: 1.5,
            validFrom: new Date("2026-02-01T00:00:00.000Z"),
          },
        ],
        date,
      }),
    ).toEqual([
      { membershipId: "m_1", assignedAmount: 600, weightUsed: 1.5 },
      { membershipId: "m_2", assignedAmount: 400, weightUsed: 1 },
    ]);
  });

  it("rejects empty participation sets", () => {
    expect(() =>
      engine.calculateSplit(1000, {
        members: [{ id: "m_1" }],
        preferences: [
          {
            membershipId: "m_1",
            mode: "NO_PARTICIPATES",
            weight: 0,
            validFrom: new Date("2026-02-01T00:00:00.000Z"),
          },
        ],
        date,
      }),
    ).toThrowError(/at least one member must participate/);
  });
});

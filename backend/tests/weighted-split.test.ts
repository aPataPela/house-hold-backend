import { describe, expect, it } from "vitest";
import { calculateWeightedSplit } from "../src/context/shared/utils/weighted-split";

describe("calculateWeightedSplit", () => {
  it.each([47000, 50000])("distributes %i CLP exactly", (total) => {
    const result = calculateWeightedSplit(total, [
      { membershipId: "m1", weight: 1 },
      { membershipId: "m2", weight: 0.5 },
    ]);
    expect(result.reduce((sum, share) => sum + share.assignedAmount, 0)).toBe(total);
  });
});

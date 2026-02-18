import test from "node:test";
import assert from "node:assert/strict";

import { WeightedSplitCalculator } from "../dist/src/domain/services/weighted-split-calculator.js";

const participants = [
  { membershipId: "m1", weight: 1 },
  { membershipId: "m2", weight: 1 },
  { membershipId: "m3", weight: 1 },
  { membershipId: "m4", weight: 1 },
  { membershipId: "m5", weight: 1 },
  { membershipId: "m6", weight: 1 },
  { membershipId: "m7", weight: 0.5 },
  { membershipId: "m8", weight: 0.5 },
];

test("WeightedSplitCalculator reparte 47.000 CLP exacto", () => {
  const calculator = new WeightedSplitCalculator();
  const result = calculator.calculate(47000, participants);

  const total = result.reduce((acc, share) => acc + share.assignedAmount, 0);
  assert.equal(total, 47000);
  assert.equal(result.every((share) => Number.isInteger(share.assignedAmount)), true);

  const full = result
    .filter((share) => share.weightUsed === 1)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  const half = result
    .filter((share) => share.weightUsed === 0.5)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  assert.deepEqual(full, [6715, 6715, 6714, 6714, 6714, 6714]);
  assert.deepEqual(half, [3357, 3357]);
});

test("WeightedSplitCalculator reparte 50.000 CLP exacto", () => {
  const calculator = new WeightedSplitCalculator();
  const result = calculator.calculate(50000, participants);

  const total = result.reduce((acc, share) => acc + share.assignedAmount, 0);
  assert.equal(total, 50000);
  assert.equal(result.every((share) => Number.isInteger(share.assignedAmount)), true);

  const full = result
    .filter((share) => share.weightUsed === 1)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  const half = result
    .filter((share) => share.weightUsed === 0.5)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  assert.deepEqual(full, [7143, 7143, 7143, 7143, 7143, 7143]);
  assert.deepEqual(half, [3571, 3571]);
});

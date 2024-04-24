import { expect, test } from "vitest";

import { notNull } from "../src";

test("notNull returns false on null", () => {
  expect(notNull(null)).toBeFalsy();
});

test("notNull returns false on undefined", () => {
  expect(notNull(undefined)).toBeFalsy();
});

test("notNull returns true on anything else", () => {
  expect(notNull("")).toBeTruthy();
});

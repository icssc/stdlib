import { expect, test } from "vitest";

import { sleep } from "../src";

test("sleep sleeps for at least the duration", async () => {
  const millis = 1000;
  const start = Date.now();
  await sleep(millis);
  const end = Date.now();
  expect(end - start).toBeGreaterThanOrEqual(millis);
});

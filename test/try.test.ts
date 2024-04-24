import { expect, test } from "vitest";

import { Try } from "../src";

test("Try satisfies the monad laws", async () => {
  const f = (x: number) => Try.from(2 * x);
  const af = async (x: number) => Try.from(2 * x);
  const g = (x: number) => Try.from(3 * x);
  const ag = async (x: number) => Try.from(3 * x);
  const h = (x: number) => f(x).flatMap(g);
  const ah = async (x: number) => (await af(x)).flatMapAsync(ag);
  const x = 5;
  const mx = Try.from(x);
  expect(mx.flatMap(f)).toEqual(f(x));
  expect(await mx.flatMapAsync(af)).toEqual(await af(x));
  expect(mx.flatMap(Try.from)).toEqual(mx);
  expect(await mx.flatMapAsync(async (x) => Try.from(x))).toEqual(mx);
  expect(mx.flatMap(h)).toEqual(mx.flatMap(f).flatMap(g));
  expect(await mx.flatMapAsync(ah)).toEqual(await (await mx.flatMapAsync(af)).flatMapAsync(ag));
});

test("Try::collect works as intended", async () => {
  const pf = (x: number): number | undefined => (x > 0 ? x : undefined);
  const pg = async (x: number): Promise<number | undefined> => (x <= 0 ? x : undefined);
  const x = Try.from(1);
  const y = Try.from(0);
  const z = Try.of(() => {
    throw new Error();
  });
  expect(x.collect(pf)).toEqual(x);
  expect(y.collect(pf).isSuccess()).toBeFalsy();
  expect(z.collect(pf)).toStrictEqual(z);
  expect((await x.collectAsync(pg)).isFailure()).toBeTruthy();
  expect(await y.collectAsync(pg)).toEqual(y);
  expect(await z.collectAsync(pg)).toStrictEqual(z);
});

test("Try::failure works as intended", () => {
  const x = Try.from(1);
  const y = Try.of(() => {
    throw new Error();
  });
  expect(x.failed().isFailure()).toBeTruthy();
  expect(y.failed().isSuccess()).toBeTruthy();
});

test("Try::filter works as intended", async () => {
  const x = Try.from(1);
  const y = Try.from(undefined);
  const e = Try.of(() => {
    throw new Error();
  });
  expect(x.filter((x) => x)).toStrictEqual(x);
  expect(y.filter((x) => x).isSuccess()).toBeFalsy();
  expect(e.filter((x) => x)).toStrictEqual(e);
  expect((await x.filterAsync(async (x) => !x)).isSuccess()).toBeFalsy();
  expect(await y.filterAsync(async (x) => !x)).toStrictEqual(y);
  expect(await e.filterAsync(async (x) => x)).toStrictEqual(e);
});

test("Try::flat works as intended", () => {
  const x = Try.of(() => 1);
  const y = Try.of(() => x);
  expect(y.flat()).toEqual(x);
});

test("Try::flatMap returns this on Failure", async () => {
  const x = Try.of(() => {
    throw new Error();
  });
  expect(x.flatMap(Try.from)).toStrictEqual(x);
  expect(await x.flatMapAsync(async (x) => Try.from(x))).toStrictEqual(x);
});

test("Try::flatMap returns Failure on error", async () => {
  const x = Try.from(1);
  const f = (_: number) => {
    throw new Error();
  };
  const af = async (_: number) => {
    throw new Error();
  };
  expect(x.flatMap(f).isSuccess()).toBeFalsy();
  expect((await x.flatMapAsync(af)).isSuccess()).toBeFalsy();
});

test("Try::get throws on Failure", () => {
  const foo = new Error("foo");
  const e = Try.of(() => {
    throw foo;
  });
  expect(() => e.get()).toThrowError(foo);
});

test("Try::ifSuccessOrElse works as intended", async () => {
  let x = 0;
  let y = 0;
  const f = (n: number) => (x += n);
  const g = () => ++y;
  const af = async (n: number) => (x += n);
  const ag = async () => ++y;
  const s = Try.from(1);
  const e = Try.of(() => {
    throw new Error();
  });
  s.ifSuccessOrElse(f, g);
  expect(x).toEqual(1);
  e.ifSuccessOrElse(f, g);
  expect(y).toEqual(1);
  await s.ifSuccessOrElseAsync(af, ag);
  expect(x).toEqual(2);
  await e.ifSuccessOrElseAsync(af, ag);
  expect(y).toEqual(2);
});

test("Try::map works as intended", async () => {
  const f = (x: number) => 2 * x;
  const af = async (x: number) => 2 * x;
  const g = (_: number) => {
    throw new Error();
  };
  const ag = async (_: number) => {
    throw new Error();
  };
  const x = Try.from(1);
  const y = Try.of(() => {
    throw new Error();
  });
  const two = Try.from(2);
  expect(x.map(f)).toEqual(two);
  expect(x.map(g).isSuccess()).toBeFalsy();
  expect(y.map(f)).toStrictEqual(y);
  expect(y.map(g)).toStrictEqual(y);
  expect(await x.mapAsync(af)).toEqual(two);
  expect((await x.mapAsync(ag)).isSuccess()).toBeFalsy();
  expect(await y.mapAsync(af)).toStrictEqual(y);
  expect(await y.mapAsync(ag)).toStrictEqual(y);
});

test("Try::or works as intended", () => {
  const s = Try.from(1);
  const e = Try.of(() => {
    throw new Error();
  });
  expect(s.or(e)).toStrictEqual(s);
  expect(e.or(s)).toStrictEqual(s);
});

test("Try::orElse works as intended", () => {
  const x = 1;
  const s = Try.from(x);
  const e = Try.of(() => {
    throw new Error();
  });
  expect(s.orElse(0)).toEqual(x);
  expect(e.orElse(x)).toEqual(x);
});

test("Try::orElseThrow works as intended", async () => {
  const foo = new Error("foo");
  const bar = new Error("bar");
  const f = (_: never) => bar;
  const af = async (_: never) => bar;
  const x = 1;
  const s = Try.from(x);
  const e = Try.of(() => {
    throw foo;
  });
  expect(s.orElseThrow()).toEqual(x);
  expect(await s.orElseThrowAsync()).toEqual(x);
  expect(() => e.orElseThrow()).toThrowError(foo);
  expect(() => e.orElseThrow(f)).toThrowError(bar);
  expect(async () => await e.orElseThrowAsync()).rejects.toThrowError(foo);
  expect(async () => await e.orElseThrowAsync(af)).rejects.toThrowError(bar);
});

test("Try::recover works as intended", async () => {
  const s = Try.from("bar");
  const e = Try.of(() => {
    throw new Error("foo");
  });
  const f = (x: Error) => x.message;
  const af = async (x: Error) => x.message;
  const g = (_: unknown) => undefined;
  const ag = async (_: unknown) => undefined;
  const foo = Try.from("foo");
  expect(s.recover(f)).toStrictEqual(s);
  expect(await s.recoverAsync(af)).toStrictEqual(s);
  expect(e.recover(f)).toEqual(foo);
  expect(await e.recoverAsync(af)).toEqual(foo);
  expect(e.recover(g).isSuccess()).toBeFalsy();
  expect((await e.recoverAsync(ag)).isSuccess()).toBeFalsy();
});

test("Try::recoverWith works as intended", async () => {
  const s = Try.from("bar");
  const e = Try.of(() => {
    throw new Error("foo");
  });
  const f = (x: Error) => Try.from(x.message);
  const af = async (x: Error) => Try.from(x.message);
  const g = (_: unknown) => undefined;
  const ag = async (_: unknown) => undefined;
  const h = (_: unknown) => {
    throw new Error();
  };
  const ah = async (_: unknown) => {
    throw new Error();
  };
  const foo = Try.from("foo");
  expect(s.recoverWith(f)).toStrictEqual(s);
  expect(await s.recoverWithAsync(af)).toStrictEqual(s);
  expect(e.recoverWith(f)).toEqual(foo);
  expect(e.recoverWith(g).isSuccess()).toBeFalsy();
  expect(e.recoverWith(h).isSuccess()).toBeFalsy();
  expect(await e.recoverWithAsync(af)).toEqual(foo);
  expect((await e.recoverWithAsync(ag)).isSuccess()).toBeFalsy();
  expect((await e.recoverWithAsync(ah)).isSuccess()).toBeFalsy();
});

test("Try::reduce works as intended", async () => {
  const s = Try.from("bar");
  const e = Try.of(() => {
    throw new Error("foo");
  });
  const f = (x: string) => `${x}-${x}`;
  const af = async (x: string) => `${x}-${x}`;
  const g = (x: Error) => x.message;
  const ag = async (x: Error) => x.message;
  const foo = "foo";
  const barBar = "bar-bar";
  expect(s.reduce(f, g)).toEqual(barBar);
  expect(await s.reduceAsync(af, ag)).toEqual(barBar);
  expect(e.reduce(f, g)).toEqual(foo);
  expect(await e.reduceAsync(af, ag)).toEqual(foo);
});

test("Try::toNullable works as intended", async () => {
  const x = 1;
  const s = Try.from(x);
  const e = Try.of(() => {
    throw new Error();
  });
  expect(s.toNullable()).toEqual(x);
  expect(e.toNullable()).toBeUndefined();
});

test("Try::transform works as intended", async () => {
  const s = Try.from("bar");
  const e = Try.of(() => {
    throw new Error("foo");
  });
  const f = (x: string) => Try.from(`${x}-${x}`);
  const af = async (x: string) => Try.from(`${x}-${x}`);
  const g = (x: Error) => Try.from(x.message);
  const ag = async (x: Error) => Try.from(x.message);
  const foo = Try.from("foo");
  const barBar = Try.from("bar-bar");
  expect(s.transform(f, g)).toEqual(barBar);
  expect(await s.transformAsync(af, ag)).toEqual(barBar);
  expect(e.transform(f, g)).toEqual(foo);
  expect(await e.transformAsync(af, ag)).toEqual(foo);
});

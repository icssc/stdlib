/**
 * The `Try` type encapsulates a computation that may result in an error,
 * reducing the amount of nesting incurred by `try`-`catch` blocks.
 *
 * Instances of `Try` are either an instance of {@link `Success`} or {@link `Failure`}.
 *
 * @remarks
 * When using error-handling methods such as {@link `failed`}, {@link `orElseThrow`},
 * {@link `recover`}, {@link `recoverWith`}, {@link `reduce`}, and {@link `transform`}
 * (and their asynchronous variants),
 * it is possible to specify the type of the error returned/accepted using the type parameter `X`.
 *
 * This is because values of any type can be thrown in JavaScript (and by extension TypeScript).
 *
 * Additionally, when using transformation methods such as {@link `collect`}, {@link `flatMap`},
 * {@link `map`}, {@link `or`}, {@link `orElse`}, {@link `recover`}, {@link `recoverWith`},
 * {@link `reduce`}, and {@link `transform`} (and their asynchronous variants), care should be taken
 * to ensure that the type of the parameter `U` is a **supertype** of the type `T`. Failure to do so
 * may result in inconsistent type checking.
 *
 * Unfortunately, the TypeScript compiler is not able to enforce this constraint.
 *
 * @privateRemarks
 * This class is based on Scala's implementation of `Try`, with some additional helper methods
 * based on those from Java's `Optional` that are useful in imperative programming contexts,
 * plus asynchronous variants of methods for use with ES6 {@link `Promise`}s.
 */
export abstract class Try<T> {
  /**
   * Creates an instance of `Try` from a value.
   *
   * **Do not** use this if the value is the result of a computation that may throw an error. That defeats the point of using the class. Instead, use {@link `of`} or {@link `ofAsync`}.
   * @param x The value.
   */
  static from<T>(x: T): Try<T> {
    return new Success(x);
  }

  /**
   * Creates an instance of `Try` from a synchronous function that may throw an error.
   * @param f The function to execute.
   */
  static of<T>(f: () => T): Try<T> {
    try {
      return new Success(f());
    } catch (e) {
      return new Failure(e);
    }
  }

  /**
   * Creates an instance of `Try` from an asynchronous function that may throw an error.
   * @param f The asynchronous function to execute.
   */
  static async ofAsync<T>(f: () => Promise<T>): Promise<Try<T>> {
    try {
      return new Success(await f());
    } catch (e) {
      return new Failure(e);
    }
  }

  /**
   * If `this` is a {@link `Success`}, and `f` is defined for the value, then returns a
   * {@link `Success`} containing `f` applied to the value.
   * Returns a {@link `Failure`} if `f` is not defined for the value or if `f` throws an error.
   * Returns `this` if `this` is a {@link `Failure`}.
   * @param f The synchronous partial function to apply to the value.
   */
  abstract collect<U>(f: (x: T) => U | null | undefined): Try<U>;

  /**
   * Asynchronous variant of {@link `collect`} that accepts an asynchronous partial function.
   * @param f The asynchronous partial function to apply to the value.
   */
  abstract collectAsync<U>(f: (x: T) => Promise<U | null | undefined>): Promise<Try<U>>;

  /**
   * Returns a {@link `Failure`} if `this` is a {@link `Success`},
   * and returns a {@link `Success`} containing the error if `this` is a {@link `Failure`}.
   */
  abstract failed<X = unknown>(): Try<X>;

  /**
   * If `this` is a {@link `Success`}, returns `this` if and only if `f` evaluates to a truthy value
   * for the value. Otherwise, return a {@link `Failure`}.
   * Returns `this` if `this` is a {@link `Failure`}.
   * @param f The synchronous predicate with which to test the value.
   */
  abstract filter(f: (x: T) => unknown): Try<T>;

  /**
   * Asynchronous variant of {@link `filter`} that accepts an asynchronous predicate.
   * @param f The asynchronous predicate with which to test the value.
   */
  abstract filterAsync(f: (x: T) => Promise<unknown>): Promise<Try<T>>;

  /**
   * Returns the inner `Try` when called on a nested `Try` instance (e.g. `Try<Try<T>>`.)
   *
   * Will cause a type error if called on a non-nested `Try`.
   */
  flat<U = T>(this: Try<Try<U>>): Try<U> {
    return this.get();
  }

  /**
   * Returns `f` applied to the value if `this` is a {@link `Success`}. If `f` throws an error,
   * returns a {@link `Failure`} containing the error.
   * Returns `this` if `this` is a {@link `Failure`}.
   * @param f The synchronous function to apply to the value.
   */
  abstract flatMap<U>(f: (x: T) => Try<U>): Try<U>;

  /**
   * Asynchronous variant of {@link `flatMap`} that accepts an asynchronous function.
   * @param f The asynchronous function to apply to the value.
   */
  abstract flatMapAsync<U>(f: (x: T) => Promise<Try<U>>): Promise<Try<U>>;

  /**
   * Returns the value if `this` is a {@link `Success`}, otherwise throws the error.
   */
  abstract get(): T;

  /**
   * Executes the impure (stateful) function `f` with the value as an argument
   * if `this` is a {@link Success}, otherwise executes `g`.
   * @param f The function to apply to the value if `this` is a {@link Success}.
   * @param g The function to execute if `this` is a {@link Failure}. Optional, defaults to nothing.
   */
  abstract ifSuccessOrElse(f: (x: T) => unknown, g?: () => unknown): void;

  /**
   * Asynchronous variant of {@link `ifSuccessOrElse`} that accepts asynchronous functions.
   * @param f The asynchronous function to apply to the value if `this` is a {@link Success}.
   * @param g The asynchronous function to execute if `this` is a {@link Failure}.
   * Optional, defaults to nothing.
   */
  abstract ifSuccessOrElseAsync(
    f: (x: T) => Promise<unknown>,
    g?: () => Promise<unknown>,
  ): Promise<void>;

  /**
   * Returns `true` if `this` is a {@link `Failure`}, `false` otherwise.
   */
  abstract isFailure(): boolean;

  /**
   * Returns `true` if `this` is a {@link `Success`}, `false` otherwise.
   */
  abstract isSuccess(): boolean;

  /**
   * Returns a {@link `Success`} containing `f` applied to the value. If `f` throws an error,
   * returns a {@link `Failure`} containing the error.
   * Returns `this` if `this` is a {@link `Failure`}.
   * @param f The function to apply to the value.
   */
  abstract map<U>(f: (x: T) => U): Try<U>;

  /**
   * Asynchronous variant of {@link `map`} that accepts an asynchronous function.
   * @param f The function to apply to the value.
   */
  abstract mapAsync<U>(f: (x: T) => Promise<U>): Promise<Try<U>>;

  /**
   * Returns `this` if `this` is a {@link `Success`}, otherwise returns `x`.
   * @param x The default `Try` to return.
   */
  abstract or<U>(x: Try<U>): Try<U>;

  /**
   * Returns the value if `this` is a {@link `Success`}, otherwise returns `x`.
   * @param x The default value to return.
   */
  abstract orElse<U>(x: U): U;

  /**
   * Returns the value if `this` is a {@link `Success`}, otherwise throws an error.
   * @param f The synchronous function to apply to the error before throwing it.
   * Defaults to the identity function if not provided.
   */
  abstract orElseThrow<X = unknown>(f?: (e: X) => unknown): T;

  /**
   * Asynchronous variant of {@link `orElseThrow`} that accepts an asynchronous function.
   * @param f The asynchronous function to apply to the error before throwing it.
   * Defaults to the identity function if not provided.
   */
  abstract orElseThrowAsync<X = unknown>(f?: (e: X) => Promise<unknown>): Promise<T>;

  /**
   * Returns `this` if `this` is a {@link `Success`}. Otherwise, if `f` is defined for the error,
   * returns a {@link `Success`} containing `f` applied to the error. Returns a {@link `Failure`}
   * if `f` is not defined for the error or if `f` throws an error.
   * @param f The synchronous function to apply to the error.
   */
  abstract recover<U, X = unknown>(f: (x: X) => U | null | undefined): Try<U>;

  /**
   * Asynchronous variant of {@link `recover`} that accepts an asynchronous function.
   * @param f The asynchronous function to apply to the error.
   */
  abstract recoverAsync<U, X = unknown>(
    f: (x: X) => Promise<U | null | undefined>,
  ): Promise<Try<U>>;

  /**
   * Returns `this` if `this` is a {@link `Success`}. Otherwise, if `f` is defined for the error,
   * returns `f` applied to the error. Returns a {@link `Failure`}
   * if `f` is not defined for the error or if `f` throws an error.
   * @param f The synchronous function to apply to the error.
   */
  abstract recoverWith<U, X = unknown>(f: (x: X) => Try<U> | null | undefined): Try<U>;

  /**
   * Asynchronous variant of {@link `recoverWith`} that accepts an asynchronous function.
   * @param f The asynchronous function to apply to the error.
   */
  abstract recoverWithAsync<U, X = unknown>(
    f: (x: X) => Promise<Try<U> | null | undefined>,
  ): Promise<Try<U>>;

  /**
   * Returns `f` applied to the value if `this` is a {@link `Success`},
   * otherwise returns `g` applied to the error.
   * @param f The function to apply to the value.
   * @param g The function to apply to the error.
   */
  abstract reduce<U, X = unknown>(f: (x: T) => U, g: (x: X) => U): U;

  /**
   * Asynchronous variant of {@link `reduce`} that accepts asynchronous functions.
   * @param f The asynchronous function to apply to the value.
   * @param g The asynchronous function to apply to the error.
   */
  abstract reduceAsync<U, X = unknown>(
    f: (x: T) => Promise<U>,
    g: (x: X) => Promise<U>,
  ): Promise<U>;

  /**
   * Returns the value if `this` is a {@link `Success`}, otherwise returns `undefined`.
   */
  abstract toNullable(): T | undefined;

  /**
   * Returns `f` applied to the value if `this` is a {@link `Success`},
   * otherwise returns `g` applied to the error.
   * @param f The synchronous function to apply to the value.
   * @param g The synchronous function to apply to the error.
   */
  abstract transform<U, X = unknown>(f: (x: T) => Try<U>, g: (x: X) => Try<U>): Try<U>;

  /**
   * Asynchronous variant of {@link `transform`} that accepts asynchronous functions.
   * @param f The asynchronous function to apply to the value.
   * @param g The asynchronous function to apply to the error.
   */
  abstract transformAsync<U, X = unknown>(
    f: (X: T) => Promise<Try<U>>,
    g: (x: X) => Promise<Try<U>>,
  ): Promise<Try<U>>;
}

class Success<T> extends Try<T> {
  private readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  collect<U>(f: (x: T) => U | null | undefined): Try<U> {
    return Try.of(() => {
      const x = f(this.value);
      if (x != null) return x;
      throw new Error(`Function not defined for ${this.value}`);
    });
  }

  async collectAsync<U>(f: (x: T) => Promise<U | null | undefined>): Promise<Try<U>> {
    return Try.ofAsync(async () => {
      const x = await f(this.value);
      if (x != null) return x;
      throw new Error(`Function not defined for ${this.value}`);
    });
  }

  failed<X = unknown>(): Try<X> {
    return new Failure<X>(new Error("Cannot call failed() on instance of Success"));
  }

  filter(f: (x: T) => unknown): Try<T> {
    return f(this.value)
      ? this
      : new Failure<T>(new Error(`Predicate does not hold for ${this.value}`));
  }

  async filterAsync(f: (x: T) => Promise<unknown>): Promise<Try<T>> {
    return (await f(this.value))
      ? this
      : new Failure<T>(new Error(`Predicate does not hold for ${this.value}`));
  }

  flatMap<U>(f: (x: T) => Try<U>): Try<U> {
    try {
      return f(this.value);
    } catch (e) {
      return new Failure<U>(e);
    }
  }

  async flatMapAsync<U>(f: (x: T) => Promise<Try<U>>): Promise<Try<U>> {
    try {
      return await f(this.value);
    } catch (e) {
      return new Failure<U>(e);
    }
  }

  get(): T {
    return this.value;
  }

  ifSuccessOrElse(f: (x: T) => void): void {
    f(this.value);
  }

  async ifSuccessOrElseAsync(f: (x: T) => Promise<void>): Promise<void> {
    await f(this.value);
  }

  /* v8 ignore start */
  isFailure(): boolean {
    return false;
  }
  /* v8 ignore stop */

  isSuccess(): boolean {
    return true;
  }

  map<U>(f: (x: T) => U): Try<U> {
    return Try.of(() => f(this.value));
  }

  async mapAsync<U>(f: (x: T) => Promise<U>): Promise<Try<U>> {
    return Try.ofAsync(async () => await f(this.value));
  }

  or<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  orElse<U>(): U {
    return this.value as unknown as U;
  }

  orElseThrow(): T {
    return this.value;
  }

  async orElseThrowAsync(): Promise<T> {
    return this.value;
  }

  recover<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  async recoverAsync<U>(): Promise<Try<U>> {
    return this as unknown as Try<U>;
  }

  recoverWith<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  async recoverWithAsync<U>(): Promise<Try<U>> {
    return this as unknown as Try<U>;
  }

  reduce<U>(f: (x: T) => U): U {
    return f(this.value);
  }

  async reduceAsync<U>(f: (x: T) => Promise<U>): Promise<U> {
    return await f(this.value);
  }

  toNullable(): T | undefined {
    return this.value;
  }

  transform<U>(f: (x: T) => Try<U>): Try<U> {
    return this.flatMap(f);
  }

  async transformAsync<U>(f: (X: T) => Promise<Try<U>>): Promise<Try<U>> {
    return this.flatMapAsync(f);
  }
}

class Failure<T> extends Try<T> {
  private readonly e: unknown;

  constructor(e: unknown) {
    super();
    this.e = e;
  }

  collect<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  async collectAsync<U>(): Promise<Try<U>> {
    return this as unknown as Try<U>;
  }

  failed<X = unknown>(): Try<X> {
    return new Success(this.e as X);
  }

  filter(): Try<T> {
    return this;
  }

  async filterAsync(): Promise<Try<T>> {
    return this;
  }

  flatMap<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  async flatMapAsync<U>(): Promise<Try<U>> {
    return this as unknown as Try<U>;
  }

  get(): T {
    throw this.e;
  }

  ifSuccessOrElse(_: never, g: () => void = () => {}): void {
    g();
  }

  async ifSuccessOrElseAsync(_: never, g: () => Promise<void> = async () => {}): Promise<void> {
    await g();
  }

  isFailure(): boolean {
    return true;
  }

  /* v8 ignore start */
  isSuccess(): boolean {
    return false;
  }
  /* v8 ignore stop */

  map<U>(): Try<U> {
    return this as unknown as Try<U>;
  }

  async mapAsync<U>(): Promise<Try<U>> {
    return this as unknown as Try<U>;
  }

  or<U>(x: Try<U>): Try<U> {
    return x;
  }

  orElse<U>(x: U): U {
    return x;
  }

  orElseThrow<X = unknown>(f: (e: X) => unknown = (e) => e): T {
    throw f(this.e as X);
  }

  async orElseThrowAsync<X = unknown>(
    f: ((e: X) => Promise<unknown>) | undefined = async (e) => e,
  ): Promise<T> {
    throw await f(this.e as X);
  }

  recover<U, X = unknown>(f: (x: X) => U | null | undefined): Try<U> {
    return Try.of(() => {
      const x = f(this.e as X);
      if (x != null) return x;
      throw new Error(`Function not defined for ${this.e}`);
    });
  }

  async recoverAsync<U, X = unknown>(f: (x: X) => Promise<U | null | undefined>): Promise<Try<U>> {
    return Try.ofAsync(async () => {
      const x = await f(this.e as X);
      if (x != null) return x;
      throw new Error(`Function not defined for ${this.e}`);
    });
  }

  recoverWith<U, X = unknown>(f: (x: X) => Try<U> | null | undefined): Try<U> {
    try {
      const x = f(this.e as X);
      return x != null ? x : new Failure<U>(new Error(`Function not defined for ${this.e}`));
    } catch (e) {
      return new Failure<U>(e);
    }
  }

  async recoverWithAsync<U, X = unknown>(
    f: (x: X) => Promise<Try<U> | null | undefined>,
  ): Promise<Try<U>> {
    try {
      const x = await f(this.e as X);
      return x != null ? x : new Failure<U>(new Error(`Function not defined for ${this.e}`));
    } catch (e) {
      return new Failure<U>(e);
    }
  }

  reduce<U, X = unknown>(_: never, g: (x: X) => U): U {
    return g(this.e as X);
  }

  async reduceAsync<U, X = unknown>(_: never, g: (x: X) => Promise<U>): Promise<U> {
    return await g(this.e as X);
  }

  toNullable(): T | undefined {
    return undefined;
  }

  transform<U, X = unknown>(_: never, g: (x: X) => Try<U>): Try<U> {
    return this.recoverWith(g);
  }

  async transformAsync<U, X = unknown>(_: never, g: (x: X) => Promise<Try<U>>): Promise<Try<U>> {
    return this.recoverWithAsync(g);
  }
}

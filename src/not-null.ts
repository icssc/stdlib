/**
 * Type guard that asserts the input is defined.
 * @param x The input to check.
 */
export const notNull = <T>(x: T): x is NonNullable<T> => x != null;

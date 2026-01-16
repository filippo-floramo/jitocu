/**
 * Type helper for generating type-safe dot-notation paths for nested objects
 *  Supports unlimited depth (practically limited only by TypeScript's recursion depth ~50-100 levels)
 */

type Primitive = string | number | boolean | null | undefined;

/**
 * Generate all possible dot-notation paths for a given type 
 *  Supports unlimited depth (practically limited by TypeScript recursion depth)
 * Example: DottedPaths<{ a: { b: { c: string } } }> = "a" | "a.b" | "a.b.c"
 */
export type DottedPaths<T, Prefix extends string = ''> =
  T extends Primitive ? Prefix :
  {
    [K in Extract<keyof T, string>]:
    Prefix extends ''
    ? K | DottedPaths<T[K], K>
    : `${Prefix}.${K}` | DottedPaths<T[K], `${Prefix}.${K}`>
  }[Extract<keyof T, string>];

/**
 * Get the type at a given path in an object
 * Example: PathValue<{ a: { b: string } }, "a.b"> = string
 */
export type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
  ? PathValue<NonNullable<T[K]>, Rest>
  : never
  : P extends keyof T
  ? T[P]
  : never;

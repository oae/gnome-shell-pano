import Gio from '@girs/gio-2.0';

declare module '@girs/gio-2.0' {
  type LastOfArray<T extends unknown[]> = T extends [data?: infer R2, ...infer R]
    ? R extends []
      ? R2
      : LastOfArray<R>
    : never;

  type AllExceptLastOfArray<T extends unknown[]> = T extends [data?: infer R2, ...infer R]
    ? R extends [data?: infer _R3]
      ? [R2]
      : R extends []
        ? []
        : [R2, AllExceptLastOfArray<R>]
    : never;

  type FlattenArray<T extends unknown[]> = T extends [infer R, infer R2]
    ? R2 extends unknown[]
      ? [R, ...FlattenArray<R2>]
      : never
    : T extends [infer _R1]
      ? T
      : never;

  export type Promisified<Func> = Func extends (...args: infer Args) => void
    ? LastOfArray<Args> extends Gio.AsyncReadyCallback<infer FinalType> | infer R
      ? (...args: FlattenArray<AllExceptLastOfArray<Args>>) => Promise<FinalType | R>
      : never
    : never;

  export type Promisified2<Func, Result> = Func extends (...args: infer Args) => void
    ? LastOfArray<Args> extends Gio.AsyncReadyCallback<infer _FinalType> | infer R
      ? (...args: FlattenArray<AllExceptLastOfArray<Args>>) => Promise<Result | R>
      : never
    : never;
}

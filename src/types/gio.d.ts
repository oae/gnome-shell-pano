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

  export type Promisified<AsyncFunc, FinishFunc> = AsyncFunc extends (...args: infer Args) => void
    ? LastOfArray<Args> extends Gio.AsyncReadyCallback<infer _FinalType> | infer R
      ? FinishFunc extends (result: Gio.AsyncResult) => infer Result
        ? (...args: FlattenArray<AllExceptLastOfArray<Args>>) => Promise<Result | R>
        : never
      : never
    : never;

  export type PromisifiedWithReturnType<AsyncFunc, Result> = AsyncFunc extends (...args: infer Args) => void
    ? LastOfArray<Args> extends Gio.AsyncReadyCallback<infer _FinalType> | infer R
      ? (...args: FlattenArray<AllExceptLastOfArray<Args>>) => Promise<Result | R>
      : never
    : never;

  export type PromisifiedWithArrayReturnType<AsyncFunc, FinishFunc> = AsyncFunc extends (...args: infer Args) => void
    ? LastOfArray<Args> extends Gio.AsyncReadyCallback<infer _FinalType> | infer R
      ? FinishFunc extends (result: Gio.AsyncResult) => infer ArrayResult
        ? ArrayResult extends [success, ...infer Result]
          ? (...args: FlattenArray<AllExceptLastOfArray<Args>>) => Promise<Result | R>
          : never
        : never
      : never
    : never;
}

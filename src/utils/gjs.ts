import GObject from '@girs/gobject-2.0';

// Taken from https://github.com/material-shell/material-shell/blob/main/src/utils/gjs.ts
/// Decorator function to call `GObject.registerClass` with the given class.
/// Use like
/// ```
/// @registerGObjectClass
/// export class MyThing extends GObject.Object { ... }
/// ```
export function registerGObjectClass<
  K,
  T extends { metaInfo?: GObject.MetaInfo<any, any, any>; new (...params: any[]): K },
>(target: T) {
  // Note that we use 'hasOwnProperty' because otherwise we would get inherited meta infos.
  // This would be bad because we would inherit the GObjectName too, which is supposed to be unique.
  if (Object.prototype.hasOwnProperty.call(target, 'metaInfo')) {
    // @ts-expect-error this is heavily js inspired code, this is correct like this, but TS wan't get it
    return GObject.registerClass<K, T>(target.metaInfo!, target) as typeof target;
  } else {
    // @ts-expect-error this is heavily js inspired code, this is correct like this, but TS wan't get it
    return GObject.registerClass<K, T>(target) as typeof target;
  }
}

export interface SignalRepresentationType<A extends any[]> {
  param_types: A;
  accumulator: number;
}

export type SignalsDefinition<T extends string> = {
  [key in T]: SignalRepresentationType<any> | Record<string, never>;
};

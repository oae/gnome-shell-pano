import type Gda5 from '@girs/gda-5.0';
import type Gda6 from '@girs/gda-6.0';

import { logger } from './shell';

const debug = logger('gda_compatibility');

// better typed functions for GDA

// we get /  have to store strings for dates and numbers for boolean
type MapGDATypes<T> = T extends boolean ? number : T extends Date ? string : T;

//@ts-expect-error: this extends the types, to be more specific, but the generic types don't like that extensions
export interface DataModelIter<T> extends Gda5.DataModelIter {
  get_value_for_field<K extends keyof T>(key: K): MapGDATypes<T[K]>;
}

//@ts-expect-error: this extends the types, to be more specific, but the generic types don't like that extensions
export interface SqlBuilder<T> extends Gda5.SqlBuilder {
  add_field_value_as_gvalue<K extends keyof T>(key: K, value: MapGDATypes<T[K]>): void;
}

// compatibility functions for Gda 5.0 and 6.0

function isGda6Builder(builder: Gda5.SqlBuilder | Gda6.SqlBuilder | SqlBuilder<any>): builder is Gda6.SqlBuilder {
  return builder.add_expr_value.length === 1;
}

/**
 * This is hack for libgda6 <> libgda5 compatibility.
 *
 * @param value any
 * @returns expr id
 */
export function add_expr_value(builder: Gda5.SqlBuilder | Gda6.SqlBuilder | SqlBuilder<any>, value: any): number {
  if (isGda6Builder(builder)) {
    return builder.add_expr_value(value);
  }

  return builder.add_expr_value(null, value);
}

/**
 * a faster unescape function for gda
 *
 * Does not the exact reverse of gda_default_escape_string(): that transforms any "''" into "'", we don't do that,
 * since this is incorrect in our usage, just unescape any "\\" into "\" and any "\'" into "'".
 * @param input string to unescape
 * @returns unescaped string or the input, if an error was be found or nothing needs to be unescaped
 */
export function unescape_string(input: string): string {
  // check if we need to escape something, so we don't mutate strings unnecessary, this speeds things up
  if (!input.includes('\\')) {
    return input;
  }

  try {
    return input.replaceAll(/\\(.)/g, (_all, captured) => {
      if (captured === '\\' || captured === "'") {
        return captured;
      }

      throw new Error(`Unexpected escape character '${captured}'`);
    });
  } catch (error) {
    debug(`Error in unescape: ${error}`);
    // return the original string
    return input;
  }
}

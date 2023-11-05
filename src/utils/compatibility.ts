import type Clutter from '@girs/clutter-12';
import type Gda5 from '@girs/gda-5.0';
import type Gda6 from '@girs/gda-6.0';
import { ButtonEvent, KeyEvent, ScrollEvent } from '@pano/types/clutter';

// compatibility functions for Gda 5.0 and 6.0

export function isGda6Builder(builder: Gda5.SqlBuilder | Gda6.SqlBuilder): builder is Gda6.SqlBuilder {
  return builder.add_expr_value.length === 1;
}

/**
 * This is hack for libgda6 <> libgda5 compatibility.
 *
 * @param value any
 * @returns expr id
 */
export function add_expr_value(builder: Gda5.SqlBuilder | Gda6.SqlBuilder, value: any): number {
  if (isGda6Builder(builder)) {
    return builder.add_expr_value(value);
  }

  return builder.add_expr_value(null, value);
}

// compatibility functions for Clutter 12 - 13

// ButtoNEvent

function isClutter13ButtonEvent(event: Clutter.ButtonEvent | ButtonEvent): event is ButtonEvent {
  return typeof (event as any).get_state === 'function' && typeof (event as any).get_button === 'function';
}

class ButtonEventProxy implements ButtonEvent {
  constructor(private event: Clutter.ButtonEvent) {
    //
  }

  get_state(): Clutter.ModifierType {
    return this.event.modifier_state;
  }
  get_button(): number {
    return this.event.button;
  }
}

export function getV13ButtonEvent(event: Clutter.ButtonEvent | ButtonEvent): ButtonEvent {
  if (isClutter13ButtonEvent(event)) {
    return event;
  }

  return new ButtonEventProxy(event);
}

// KeyEvent

function isClutter13KeyEvent(event: Clutter.KeyEvent | KeyEvent): event is KeyEvent {
  return (
    typeof (event as any).type === 'function' &&
    typeof (event as any).get_state === 'function' &&
    typeof (event as any).get_key_symbol === 'function'
  );
}

class KeyEventProxy implements KeyEvent {
  constructor(private event: Clutter.KeyEvent) {
    //
  }
  type(): Clutter.EventType {
    return this.event.type;
  }
  get_state(): Clutter.ModifierType {
    return this.event.modifier_state;
  }
  get_key_symbol(): number {
    return this.event.keyval;
  }
}

export function getV13KeyEvent(event: Clutter.KeyEvent | KeyEvent): KeyEvent {
  if (isClutter13KeyEvent(event)) {
    return event;
  }

  return new KeyEventProxy(event);
}

// ScrollEvent

function isClutter13ScrollEvent(event: Clutter.ScrollEvent | ScrollEvent): event is ScrollEvent {
  return typeof (event as any).get_scroll_direction === 'function';
}

class ScrollEventProxy implements ScrollEvent {
  constructor(private event: Clutter.ScrollEvent) {
    //
  }
  get_scroll_direction(): Clutter.ScrollDirection {
    return this.event.direction;
  }
}

export function getV13ScrollEvent(event: Clutter.ScrollEvent | ScrollEvent): ScrollEvent {
  if (isClutter13ScrollEvent(event)) {
    return event;
  }

  return new ScrollEventProxy(event);
}

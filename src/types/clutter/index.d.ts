import { EventType, ModifierType, ScrollDirection } from '@gi-types/clutter10';
import * as GObject from '@gi-types/gobject2';

export class KeyEvent {
  static $gtype: GObject.GType<KeyEvent>;

  constructor(copy: KeyEvent);

  // Fields
  type: () => EventType;
  // time: number;
  // flags: EventFlags;
  // stage: Stage;
  get_state: () => ModifierType;
  get_key_symbol: () => number;
  // hardware_keycode: number;
  // unicode_value: number;
  // evdev_code: number;
  // device: InputDevice;
}

export class ButtonEvent {
  static $gtype: GObject.GType<ButtonEvent>;

  constructor(copy: ButtonEvent);

  // Fields
  // type: EventType;
  // time: number;
  // flags: EventFlags;
  // stage: Stage;
  // x: number;
  // y: number;
  get_state: () => ModifierType;
  get_button: () => number;
  // axes: number;
  // device: InputDevice;
  // evdev_code: number;
}

export class ScrollEvent {
  static $gtype: GObject.GType<ScrollEvent>;

  constructor(copy: ScrollEvent);

  // Fields
  // type: EventType;
  // time: number;
  // flags: EventFlags;
  // stage: Stage;
  // x: number;
  // y: number;
  get_scroll_direction: () => ScrollDirection;
  // modifier_state: ModifierType;
  // axes: number;
  // device: InputDevice;
  // scroll_source: ScrollSource;
  // finish_flags: ScrollFinishFlags;
}

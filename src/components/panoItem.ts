import {
  ActorAlign,
  EVENT_PROPAGATE,
  EVENT_STOP,
  get_current_event_time,
  KEY_Control_L,
  KEY_Delete,
  KEY_ISO_Enter,
  KEY_KP_Delete,
  KEY_KP_Enter,
  KEY_Return,
  KEY_S,
  KEY_s,
  KEY_v,
  KeyState,
  ModifierType,
} from '@gi-types/clutter10';
import Gio from '@gi-types/gio2';
import GLib from '@gi-types/glib2';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { Point } from '@gi-types/graphene1';
import { Cursor } from '@gi-types/meta10';
import Shell from '@gi-types/shell0';
import St1 from '@gi-types/st1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItemHeader } from '@pano/components/panoItemHeader';
import { ButtonEvent, KeyEvent } from '@pano/types/clutter';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getVirtualKeyboard, WINDOW_POSITIONS } from '@pano/utils/ui';
@registerGObjectClass
export class PanoItem extends St1.BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoItem',
    Signals: {
      activated: {},
      'on-remove': {
        param_types: [TYPE_STRING],
        accumulator: 0,
      },
      'on-favorite': {
        param_types: [TYPE_STRING],
        accumulator: 0,
      },
    },
  };

  protected header: PanoItemHeader;
  private timeoutId: number | undefined;
  protected body: St1.BoxLayout;
  protected clipboardManager: ClipboardManager;
  public dbItem: DBItem;
  protected settings: Gio.Settings;
  private selected: boolean;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super({
      name: 'pano-item',
      visible: true,
      pivot_point: new Point({ x: 0.5, y: 0.5 }),
      reactive: true,
      style_class: 'pano-item',
      vertical: true,
      track_hover: true,
    });

    this.clipboardManager = clipboardManager;
    this.dbItem = dbItem;

    this.settings = getCurrentExtensionSettings(ext);

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));
    this.connect('enter-event', () => {
      Shell.Global.get().display.set_cursor(Cursor.POINTING_HAND);
      if (!this.selected) {
        this.set_style(`border: 4px solid ${this.settings.get_string('hovered-item-border-color')}`);
      }
    });
    this.connect('leave-event', () => {
      Shell.Global.get().display.set_cursor(Cursor.DEFAULT);
      if (!this.selected) {
        this.set_style('');
      }
    });

    this.connect('activated', () => {
      this.get_parent()?.get_parent()?.get_parent()?.hide();

      if (this.dbItem.itemType === 'LINK' && this.settings.get_boolean('open-links-in-browser')) {
        return;
      }

      if (this.settings.get_boolean('paste-on-select')) {
        // See https://github.com/SUPERCILEX/gnome-clipboard-history/blob/master/extension.js#L606
        this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.PRESSED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.PRESSED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.RELEASED);
          if (this.timeoutId) {
            GLib.Source.remove(this.timeoutId);
          }
          this.timeoutId = undefined;
          return GLib.SOURCE_REMOVE;
        });
      }
    });

    this.header = new PanoItemHeader(ext, getPanoItemTypes(ext)[dbItem.itemType], dbItem.copyDate);
    this.header.setFavorite(this.dbItem.isFavorite);
    this.header.connect('on-remove', () => {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return EVENT_PROPAGATE;
    });

    this.header.connect('on-favorite', () => {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return EVENT_PROPAGATE;
    });

    this.connect('on-favorite', () => {
      this.header.setFavorite(this.dbItem.isFavorite);
      return EVENT_PROPAGATE;
    });

    this.body = new St1.BoxLayout({
      style_class: 'pano-item-body',
      clip_to_allocation: true,
      vertical: true,
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.FILL,
      x_expand: true,
      y_expand: true,
    });

    this.add_child(this.header);
    this.add_child(this.body);

    const themeContext = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    themeContext.connect('notify::scale-factor', () => {
      this.setBodyDimensions();
    });
    this.settings.connect('changed::item-size', () => {
      this.setBodyDimensions();
    });
    this.settings.connect('changed::window-position', () => {
      this.setBodyDimensions();
    });

    this.setBodyDimensions();
  }

  private setBodyDimensions() {
    const pos = this.settings.get_uint('window-position');
    if (pos === WINDOW_POSITIONS.LEFT || pos === WINDOW_POSITIONS.RIGHT) {
      this.set_x_align(ActorAlign.FILL);
      this.set_y_align(ActorAlign.START);
    } else {
      this.set_x_align(ActorAlign.START);
      this.set_y_align(ActorAlign.FILL);
    }
    const { scaleFactor } = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());
    this.body.set_height(this.settings.get_int('item-size') * scaleFactor - this.header.get_height());
    this.body.set_width(this.settings.get_int('item-size') * scaleFactor);
  }

  private setSelected(selected: boolean) {
    if (selected) {
      const activeItemBorderColor = this.settings.get_string('active-item-border-color');
      this.set_style(`border: 4px solid ${activeItemBorderColor} !important;`);
      this.grab_key_focus();
    } else {
      this.set_style('');
    }
    this.selected = selected;
  }
  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (
      event.get_key_symbol() === KEY_Return ||
      event.get_key_symbol() === KEY_ISO_Enter ||
      event.get_key_symbol() === KEY_KP_Enter
    ) {
      this.emit('activated');
      return EVENT_STOP;
    }
    if (event.get_key_symbol() === KEY_Delete || event.get_key_symbol() === KEY_KP_Delete) {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return EVENT_STOP;
    }
    if (
      (event.get_key_symbol() === KEY_S || event.get_key_symbol() === KEY_s) &&
      event.get_state() === ModifierType.CONTROL_MASK
    ) {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return EVENT_STOP;
    }
    return EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(event: ButtonEvent): boolean {
    if (event.get_button() === 1) {
      this.emit('activated');
      return EVENT_STOP;
    }

    return EVENT_PROPAGATE;
  }

  override destroy(): void {
    if (this.timeoutId) {
      GLib.Source.remove(this.timeoutId);
    }
    this.header.destroy();
    super.destroy();
  }
}

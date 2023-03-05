import {
  ButtonEvent,
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
  KeyEvent,
  KeyState,
  ModifierType,
} from '@gi-types/clutter10';
import { Settings } from '@gi-types/gio2';
import { PRIORITY_DEFAULT, Source, SOURCE_REMOVE, timeout_add } from '@gi-types/glib2';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { Point } from '@gi-types/graphene1';
import { Cursor } from '@gi-types/meta10';
import { Global } from '@gi-types/shell0';
import { BoxLayout } from '@gi-types/st1';
import { PanoItemHeader } from '@pano/components/panoItemHeader';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getVirtualKeyboard } from '@pano/utils/ui';

@registerGObjectClass
export class PanoItem extends BoxLayout {
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
  protected body: BoxLayout;
  public dbItem: DBItem;
  protected settings: Settings;
  private selected: boolean;

  constructor(dbItem: DBItem) {
    super({
      name: 'pano-item',
      visible: true,
      pivot_point: new Point({ x: 0.5, y: 0.5 }),
      reactive: true,
      style_class: 'pano-item',
      vertical: true,
      track_hover: true,
    });

    this.dbItem = dbItem;

    this.settings = getCurrentExtensionSettings();

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));
    this.connect('enter-event', () => {
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
      if (!this.selected) {
        this.set_style(`border: 4px solid ${this.settings.get_string('hovered-item-border-color')}`);
      }
    });
    this.connect('motion-event', () => {
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
    });
    this.connect('leave-event', () => {
      Global.get().display.set_cursor(Cursor.DEFAULT);
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
        this.timeoutId = timeout_add(PRIORITY_DEFAULT, 250, () => {
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.PRESSED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.PRESSED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
          getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.RELEASED);
          if (this.timeoutId) {
            Source.remove(this.timeoutId);
          }
          this.timeoutId = undefined;
          return SOURCE_REMOVE;
        });
      }
    });

    this.header = new PanoItemHeader(PanoItemTypes[dbItem.itemType], dbItem.copyDate);
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

    this.body = new BoxLayout({
      style_class: 'pano-item-body',
      clip_to_allocation: true,
      vertical: true,
      x_expand: true,
      y_expand: true,
    });

    this.add_child(this.header);
    this.add_child(this.body);

    this.set_height(this.settings.get_int('window-height') - 80);
    this.set_width(this.settings.get_int('window-height') - 80);
    this.body.set_height(this.settings.get_int('window-height') - 80 - 57);
    this.settings.connect('changed::window-height', () => {
      this.set_height(this.settings.get_int('window-height') - 80);
      this.set_width(this.settings.get_int('window-height') - 80);
      this.body.set_height(this.settings.get_int('window-height') - 80 - 57);
    });
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
    if (event.keyval === KEY_Return || event.keyval === KEY_ISO_Enter || event.keyval === KEY_KP_Enter) {
      this.emit('activated');
      return EVENT_STOP;
    }
    if (event.keyval === KEY_Delete || event.keyval === KEY_KP_Delete) {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return EVENT_STOP;
    }
    if ((event.keyval === KEY_S || event.keyval === KEY_s) && event.modifier_state === ModifierType.CONTROL_MASK) {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return EVENT_STOP;
    }
    return EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(event: ButtonEvent): boolean {
    if (event.button === 1) {
      this.emit('activated');
      return EVENT_STOP;
    }

    return EVENT_PROPAGATE;
  }

  override destroy(): void {
    if (this.timeoutId) {
      Source.remove(this.timeoutId);
    }
    this.header.destroy();
    super.destroy();
  }
}

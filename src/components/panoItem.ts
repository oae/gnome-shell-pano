import {
  ActorAlign,
  AnimationMode,
  ButtonEvent,
  EVENT_PROPAGATE,
  EVENT_STOP,
  get_current_event_time,
  KeyEvent,
  KeyState,
  KEY_Control_L,
  KEY_Delete,
  KEY_ISO_Enter,
  KEY_KP_Delete,
  KEY_KP_Enter,
  KEY_Return,
  KEY_v,
} from '@gi-types/clutter10';
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
    },
  };

  private header: PanoItemHeader;
  private indicatorBox: BoxLayout;
  private timeoutId: number | undefined;
  protected body: BoxLayout;
  public dbItem: DBItem;

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

    this.indicatorBox = new BoxLayout({
      visible: true,
      x_align: ActorAlign.CENTER,
      y_align: ActorAlign.END,
      height: 0,
      width: 0,
      translation_y: 5,
      style: 'background: #1e66f5; border-radius: 999px; box-shadow: 0px 0px 2px 1px #1e66f5;',
    });

    this.dbItem = dbItem;

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));
    this.connect('enter-event', () => {
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
    });
    this.connect('motion-event', () => {
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
    });
    this.connect('leave-event', () => {
      Global.get().display.set_cursor(Cursor.DEFAULT);
    });

    this.connect('activated', () => {
      this.get_parent()?.get_parent()?.get_parent()?.hide();

      if (getCurrentExtensionSettings().get_boolean('paste-on-select')) {
        // See https://github.com/SUPERCILEX/gnome-clipboard-history/blob/master/extension.js#L606
        this.timeoutId = timeout_add(PRIORITY_DEFAULT, 250, () => {
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
    this.header.connect('on-remove', () => {
      this.emit('on-remove', JSON.stringify(this.dbItem));
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
    this.add_child(this.indicatorBox);
  }

  private setSelected(selected: boolean) {
    if (selected) {
      this.add_style_pseudo_class('selected');
      this.indicatorBox.ease({
        height: 5,
        width: 290,
        duration: 150,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
      this.ease({
        translation_y: -5,
        duration: 150,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
      this.grab_key_focus();
    } else {
      this.remove_style_pseudo_class('selected');
      this.indicatorBox.ease({
        height: 0,
        width: 0,
        duration: 150,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
      this.ease({
        translation_y: 0,
        duration: 150,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
    }
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
    this.indicatorBox.destroy();
    super.destroy();
  }
}

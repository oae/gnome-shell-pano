import {
  ButtonEvent,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  KEY_Delete,
  KEY_ISO_Enter,
  KEY_KP_Delete,
  KEY_KP_Enter,
  KEY_Return,
} from '@gi-types/clutter10';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { Point } from '@gi-types/graphene1';
import { Cursor } from '@gi-types/meta10';
import { Global } from '@gi-types/shell0';
import { BoxLayout } from '@gi-types/st1';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItemHeader } from '@pano/components/panoItemHeader';

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
  public dbItem: DBItem;
  protected body: BoxLayout;

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

    this.connect('activated', () => this.get_parent()?.get_parent()?.get_parent()?.hide());

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
    });

    this.add_child(this.header);
    this.add_child(this.body);
  }

  private setSelected(selected: boolean) {
    if (selected) {
      this.add_style_pseudo_class('selected');
      this.grab_key_focus();
    } else {
      this.remove_style_pseudo_class('selected');
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
    this.header.destroy();
    super.destroy();
  }
}

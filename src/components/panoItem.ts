import {
  ButtonEvent,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  KEY_ISO_Enter,
  KEY_KP_Enter,
  KEY_Return,
} from '@imports/clutter10';
import { MetaInfo } from '@imports/gobject2';
import { Point } from '@imports/graphene1';
import { BoxLayout } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { IPanoItemType } from '@pano/utils/panoItemType';
import { PanoItemHeader } from './panoItemHeader';
@registerGObjectClass
export class PanoItem extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoItem',
    Signals: {
      activated: {},
    },
  };

  private header: PanoItemHeader;
  public dbId: number | null;
  protected body: BoxLayout;

  constructor(dbId: number | null, itemType: IPanoItemType, date: Date) {
    super({
      name: 'pano-item',
      visible: true,
      pivot_point: new Point({ x: 0.5, y: 0.5 }),
      reactive: true,
      style_class: 'pano-item',
      vertical: true,
    });

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));

    this.dbId = dbId;

    this.header = new PanoItemHeader(itemType, date);
    this.header.connect('on-remove', () => {
      log(`removed item with id: ${dbId}`);
    });

    this.header.connect('on-favorite', () => {
      log(`favorite item with id: ${dbId}`);
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

  private setActivated() {
    this.emit('activated');
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
      this.setActivated();
      return EVENT_STOP;
    }
    return EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(event: ButtonEvent): boolean {
    if (event.button === 1) {
      this.setActivated();
      return EVENT_STOP;
    }

    return EVENT_PROPAGATE;
  }
}

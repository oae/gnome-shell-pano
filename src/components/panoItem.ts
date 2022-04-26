import {
  ActorAlign,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  KEY_ISO_Enter,
  KEY_KP_Enter,
  KEY_Return,
} from '@imports/clutter10';
import { icon_new_for_string } from '@imports/gio2';
import { MetaInfo } from '@imports/gobject2';
import { Point } from '@imports/graphene1';
import { BoxLayout, Icon, Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtension } from '@pano/utils/shell';
import { formatDistanceToNow } from 'date-fns';
@registerGObjectClass
export class PanoItem extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoItem',
    Signals: {
      activated: {},
    },
  };

  private itemType: IPanoItemType;
  private date: Date;
  private header: BoxLayout;
  private dateLabel: Label;
  private dateUpdateIntervalId: any;
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

    // this.connect('enter-event', () => this.setSelected(true));
    // this.connect('leave-event', () => this.setSelected(false));

    this.itemType = itemType;
    this.date = date;
    this.dbId = dbId;

    this.header = new BoxLayout({
      style_class: `pano-item-header pano-item-header-${this.itemType.classSuffix}`,
      vertical: false,
      x_expand: true,
    });
    const titleContainer = new BoxLayout({
      style_class: 'pano-item-title-container',
      vertical: true,
    });
    const iconContainer = new BoxLayout({
      style_class: 'pano-icon-container',
      x_align: ActorAlign.END,
      y_align: ActorAlign.FILL,
      x_expand: true,
    });

    iconContainer.add_child(
      new Icon({
        gicon: icon_new_for_string(`${getCurrentExtension().path}/icons/${this.itemType.icon}`),
        style_class: 'pano-icon',
      }),
    );

    titleContainer.add_child(
      new Label({
        text: this.itemType.title,
        style_class: 'pano-item-title',
        x_expand: true,
      }),
    );

    this.dateLabel = new Label({
      text: formatDistanceToNow(this.date, { addSuffix: true }),
      style_class: 'pano-item-date',
      x_expand: true,
      y_expand: true,
    });

    this.dateUpdateIntervalId = setInterval(() => {
      this.dateLabel.set_text(formatDistanceToNow(this.date, { addSuffix: true }));
    }, 60000);

    titleContainer.add_child(this.dateLabel);

    this.header.add_child(titleContainer);
    this.header.add_child(iconContainer);

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

  // override vfunc_button_press_event(event: ButtonEvent): boolean {
  //   if (event.button === 1) {
  //     this.setActivated();
  //     return EVENT_STOP;
  //   }

  //   return EVENT_PROPAGATE;
  // }

  override vfunc_destroy(): void {
    clearInterval(this.dateUpdateIntervalId);
    super.vfunc_destroy();
  }
}

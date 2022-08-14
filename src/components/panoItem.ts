import {
  ActorAlign,
  ButtonEvent,
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
import { BoxLayout, Button, Icon, Label } from '@imports/st1';
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
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.FILL,
      x_expand: true,
    });
    const iconContainer = new BoxLayout({
      style_class: 'pano-icon-container',
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

    const actionContainer = new BoxLayout({
      style_class: 'pano-item-actions',
      x_expand: false,
      y_expand: true,
      x_align: ActorAlign.END,
      y_align: ActorAlign.START,
    });

    const favoriteIcon = new Icon({
      icon_name: 'emblem-favorite-symbolic',
      icon_size: 12,
    });

    const favoriteButton = new Button({
      style_class: 'pano-item-favorite-button',
      child: favoriteIcon,
    });

    favoriteButton.connect('clicked', () => {
      log(`favorite item with id: ${this.dbId}`);
    });

    const removeIcon = new Icon({
      icon_name: 'window-close-symbolic',
      icon_size: 12,
    });

    const removeButton = new Button({
      style_class: 'pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      log(`removed item with id: ${this.dbId}`);
    });

    actionContainer.add_child(favoriteButton);
    actionContainer.add_child(removeButton);

    this.header.add_child(iconContainer);
    this.header.add_child(titleContainer);
    this.header.add_child(actionContainer);

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

  override vfunc_destroy(): void {
    clearInterval(this.dateUpdateIntervalId);
    super.vfunc_destroy();
  }
}

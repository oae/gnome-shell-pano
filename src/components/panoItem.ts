import { ActorAlign } from '@imports/clutter10';
import { icon_new_for_string } from '@imports/gio2';
import { BoxLayout, Icon, Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtension } from '@pano/utils/shell';
import { formatDistanceToNow } from 'date-fns';

@registerGObjectClass
export class PanoItem extends BoxLayout {
  private itemType: IPanoItemType;
  private date: Date;
  private header: BoxLayout;
  private dateLabel: Label;
  private dateUpdateIntervalId: any;

  protected body: BoxLayout;

  constructor(itemType: IPanoItemType, date: Date) {
    super({
      name: 'pano-item',
      visible: true,
      reactive: true,
      style_class: 'pano-item',
      vertical: true,
    });

    this.itemType = itemType;
    this.date = date;

    this.header = new BoxLayout({
      style_class: `pano-item-header pano-item-header-${this.itemType.classSuffix}`,
      vertical: false,
      x_expand: true,
    });
    const titleContainer = new BoxLayout({
      style: 'margin: 12px',
      vertical: true,
    });
    const iconContainer = new BoxLayout({
      style: 'margin-right: 12px',
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
      vertical: true,
      x_expand: true,
      y_expand: true,
    });

    this.add_child(this.header);
    this.add_child(this.body);
  }

  override vfunc_destroy(): void {
    clearInterval(this.dateUpdateIntervalId);
    super.vfunc_destroy();
  }
}

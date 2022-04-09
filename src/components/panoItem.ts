import { ActorAlign } from '@imports/clutter10';
import { BoxLayout, Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { IPanoItemType } from '@pano/utils/panoItemType';
import { formatDistanceToNow } from 'date-fns';

@registerGObjectClass
export class PanoItem extends BoxLayout {
  private itemType: IPanoItemType;
  private date: Date;
  private header: BoxLayout;
  private body: BoxLayout;

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
      style_class: `pano-item-top pano-item-top-${this.itemType.classSuffix}`,
      vertical: false,
      x_expand: true,
      height: 80,
    });
    const headerContent = new BoxLayout({
      style: 'margin: 12px',
      vertical: true,
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.FILL,
    });
    headerContent.add_child(
      new Label({
        text: itemType.title,
        style_class: 'pano-item-top-title',
        x_expand: true,
      }),
    );
    headerContent.add_child(
      new Label({
        text: formatDistanceToNow(this.date, { addSuffix: true, includeSeconds: true }),
        style_class: 'pano-item-top-date',
        x_expand: true,
        y_expand: true,
      }),
    );

    this.header.add_child(headerContent);

    this.body = new BoxLayout({
      style_class: 'pano-item-bottom',
      vertical: true,
      x_expand: true,
      y_expand: true,
    });

    this.add_child(this.header);
    this.add_child(this.body);
  }
}

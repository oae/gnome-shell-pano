import { ActorAlign } from '@gi-types/clutter10';
import { BoxLayout, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class ColorPanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-color');

    const colorContainer = new BoxLayout({
      vertical: false,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style: `border-radius: 0px 0px 10px 10px; background-color: ${this.dbItem.content};`,
    });

    colorContainer.add_child(
      new Label({
        x_align: ActorAlign.CENTER,
        y_align: ActorAlign.CENTER,
        x_expand: true,
        y_expand: true,
        text: this.dbItem.content,
        style: 'font-size: 16px; border-radius: 999px; background-color: black; color: white; padding: 10px',
      }),
    );

    this.body.add_child(colorContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }
}

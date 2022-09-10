import { ActorAlign, AlignAxis, AlignConstraint } from '@gi-types/clutter10';
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
      style_class: 'color-container',
      style: `background-color: ${this.dbItem.content};`,
    });

    colorContainer.add_child(
      new Label({
        x_align: ActorAlign.CENTER,
        y_align: ActorAlign.CENTER,
        x_expand: true,
        y_expand: true,
        text: this.dbItem.content,
        style_class: 'color-label',
      }),
    );

    colorContainer.add_constraint(
      new AlignConstraint({
        source: this,
        align_axis: AlignAxis.Y_AXIS,
        factor: 0.005,
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

import { EllipsizeMode, WrapMode } from '@gi-types/pango1';
import { Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class TextPanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-text');
    const label = new Label({
      text: this.dbItem.content.trim(),
      style_class: 'pano-item-body-text-content',
    });
    label.clutter_text.line_wrap = true;
    label.clutter_text.line_wrap_mode = WrapMode.WORD_CHAR;
    label.clutter_text.ellipsize = EllipsizeMode.END;
    this.body.add_child(label);
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

import { EllipsizeMode } from '@gi-types/pango1';
import { Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { markupCode } from '@pano/utils/pango';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-code');

    const label = new Label({
      style_class: 'pano-item-body-code-content',
      clip_to_allocation: true,
    });
    label.clutter_text.use_markup = true;
    label.clutter_text.set_markup(markupCode(this.dbItem.content.trim()));
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

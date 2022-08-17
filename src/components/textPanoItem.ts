import { EllipsizeMode } from '@imports/pango1';
import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from '@pano/components/panoItem';
import { clipboardManager, ClipboardContent, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
@registerGObjectClass
export class TextPanoItem extends PanoItem {
  private clipboardContent: string;

  constructor(id: number | null, content: string, date: Date) {
    super(id, PanoItemTypes.TEXT, date);
    this.clipboardContent = content;

    this.body.style_class = [this.body.style_class, 'pano-item-body-text'].join(' ');
    const label = new Label({
      text: this.clipboardContent,
      style_class: 'pano-item-body-text-content',
    });
    label.clutter_text.line_wrap = true;
    label.clutter_text.ellipsize = EllipsizeMode.END;
    this.body.add_child(label);

    if (!this.dbId) {
      const savedItem = db.save({
        content: this.clipboardContent,
        copyDate: date,
        isFavorite: false,
        itemType: 'TEXT',
        matchValue: this.clipboardContent,
        searchValue: this.clipboardContent,
      });
      if (savedItem) {
        this.dbId = savedItem.id;
      }
    }

    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.clipboardContent,
      }),
    );
  }
}

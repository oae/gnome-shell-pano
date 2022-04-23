import { EllipsizeMode } from '@imports/pango1';
import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from '@pano/components/panoItem';
import { clipboardManager, ClipboardContent, ContentType } from '@pano/utils/clipboardManager';
@registerGObjectClass
export class TextPanoItem extends PanoItem {
  private clipboardContent: string;

  constructor(content: string, date: Date) {
    super(PanoItemTypes.TEXT, date);
    this.clipboardContent = content;
    this.body.style_class = [this.body.style_class, 'pano-item-body-text'].join(' ');
    const label = new Label({
      text: this.clipboardContent,
      style_class: 'pano-item-body-text-content',
    });
    label.clutter_text.line_wrap = true;
    label.clutter_text.ellipsize = EllipsizeMode.END;
    this.body.add_child(label);
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

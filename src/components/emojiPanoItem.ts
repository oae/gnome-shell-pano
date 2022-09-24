import { ActorAlign } from '@gi-types/clutter10';
import { EllipsizeMode, WrapMode } from '@gi-types/pango1';
import { BoxLayout, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class EmojiPanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-emoji');

    const emojiContainer = new BoxLayout({
      vertical: false,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style_class: 'emoji-container',
    });

    const label = new Label({
      x_align: ActorAlign.CENTER,
      y_align: ActorAlign.CENTER,
      x_expand: true,
      y_expand: true,
      text: this.dbItem.content,
      style_class: 'pano-item-body-emoji-content',
    });
    label.clutter_text.line_wrap = true;
    label.clutter_text.line_wrap_mode = WrapMode.WORD_CHAR;
    label.clutter_text.ellipsize = EllipsizeMode.END;
    emojiContainer.add_child(label);

    this.body.add_child(emojiContainer);
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

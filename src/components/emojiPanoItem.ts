import { ActorAlign } from '@gi-types/clutter10';
import { Settings } from '@gi-types/gio2';
import { EllipsizeMode, WrapMode } from '@gi-types/pango1';
import { BoxLayout, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class EmojiPanoItem extends PanoItem {
  private emojiItemSettings: Settings;
  private label: Label;

  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-emoji');

    this.emojiItemSettings = this.settings.get_child('emoji-item');

    const emojiContainer = new BoxLayout({
      vertical: false,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style_class: 'emoji-container',
    });

    this.label = new Label({
      x_align: ActorAlign.CENTER,
      y_align: ActorAlign.CENTER,
      x_expand: true,
      y_expand: true,
      text: this.dbItem.content,
      style_class: 'pano-item-body-emoji-content',
    });
    this.label.clutter_text.line_wrap = true;
    this.label.clutter_text.line_wrap_mode = WrapMode.WORD_CHAR;
    this.label.clutter_text.ellipsize = EllipsizeMode.END;
    emojiContainer.add_child(this.label);

    this.body.add_child(emojiContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.emojiItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.emojiItemSettings.get_string('header-bg-color');
    const headerColor = this.emojiItemSettings.get_string('header-color');
    const bodyBgColor = this.emojiItemSettings.get_string('body-bg-color');
    const emojiSize = this.emojiItemSettings.get_int('emoji-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor};`);
    this.label.set_style(`font-size: ${emojiSize}px;`);
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

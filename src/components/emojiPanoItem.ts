import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-16';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { orientationCompatibility } from '@pano/utils/shell_compatibility';
@registerGObjectClass
export class EmojiPanoItem extends PanoItem {
  private emojiItemSettings: Gio.Settings;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.emojiItemSettings = this.settings.get_child('emoji-item');

    const emojiContainer = new St.BoxLayout({
      ...orientationCompatibility(false),
      xExpand: true,
      yExpand: true,
      yAlign: Clutter.ActorAlign.FILL,
      xAlign: Clutter.ActorAlign.FILL,
      styleClass: 'emoji-container',
    });

    this.label = new St.Label({
      xAlign: Clutter.ActorAlign.CENTER,
      yAlign: Clutter.ActorAlign.CENTER,
      xExpand: true,
      yExpand: true,
      text: this.dbItem.content,
      styleClass: 'pano-item-body-emoji-content',
    });
    this.label.clutterText.lineWrap = true;
    this.label.clutterText.lineWrapMode = Pango.WrapMode.WORD_CHAR;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    emojiContainer.add_child(this.label);

    this.body.add_child(emojiContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.emojiItemSettings.connect('changed', this.setStyle.bind(this));
    this.settings.connect('changed::compact-mode', this.setStyle.bind(this));
    this.settings.connect('changed::item-size', this.setStyle.bind(this));
  }

  private setStyle() {
    const bodyBgColor = this.emojiItemSettings.get_string('body-bg-color');
    const emojiSize = this.emojiItemSettings.get_int('emoji-size');

    this.body.set_style(`background-color: ${bodyBgColor};`);
    this.label.set_style(`font-size: ${Math.min(emojiSize, this.body.height - 24)}px;`);
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }
}

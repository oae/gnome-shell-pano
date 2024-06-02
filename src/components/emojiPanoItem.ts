import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { getItemBackgroundColor } from '@pano/utils/color';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class EmojiPanoItem extends PanoItem {
  private emojiItemSettings: Gio.Settings;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.emojiItemSettings = this.settings.get_child('emoji-item');

    this.label = new St.Label({
      xAlign: Clutter.ActorAlign.CENTER,
      yAlign: Clutter.ActorAlign.CENTER,
      xExpand: true,
      yExpand: true,
      text: this.dbItem.content,
      styleClass: 'pano-item-body-emoji-content',
    });
    this.label.clutterText.lineAlignment = Pango.Alignment.CENTER;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.NONE;

    this.body.add_child(this.label);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.emojiItemSettings.connect('changed', this.setStyle.bind(this));
    this.settings.connect('changed::compact-mode', this.setStyle.bind(this));
    this.settings.connect('changed::item-height', this.setStyle.bind(this));

    // Settings for controls
    this.settings.connect('changed::is-in-incognito', this.setStyle.bind(this));
    this.settings.connect('changed::incognito-window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::header-style', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.emojiItemSettings.get_string('header-bg-color');
    const headerColor = this.emojiItemSettings.get_string('header-color');
    const bodyBgColor = this.emojiItemSettings.get_string('body-bg-color');
    const emojiSize = this.emojiItemSettings.get_int('emoji-size');

    this.overlay.setControlsBackground(getItemBackgroundColor(this.settings, headerBgColor, bodyBgColor));
    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
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

import Gio from '@girs/gio-2.0';
import Pango from '@girs/pango-1.0';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class TextPanoItem extends PanoItem {
  private textItemSettings: Gio.Settings;
  private label: St1.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.textItemSettings = this.settings.get_child('text-item');

    this.label = new St1.Label({
      style_class: 'pano-item-body-text-content',
    });
    this.label.clutter_text.line_wrap = true;
    this.label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
    this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

    this.body.add_child(this.label);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.textItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.textItemSettings.get_string('header-bg-color');
    const headerColor = this.textItemSettings.get_string('header-color');
    const bodyBgColor = this.textItemSettings.get_string('body-bg-color');
    const bodyColor = this.textItemSettings.get_string('body-color');
    const bodyFontFamily = this.textItemSettings.get_string('body-font-family');
    const bodyFontSize = this.textItemSettings.get_int('body-font-size');
    const characterLength = this.textItemSettings.get_int('char-length');

    // Set header styles
    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);

    // Set body styles
    this.body.set_style(`background-color: ${bodyBgColor}`);

    // set label styles
    this.label.set_text(this.dbItem.content.trim().slice(0, characterLength));
    this.label.set_style(`color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px;`);
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

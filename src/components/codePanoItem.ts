import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { markupCode } from '@pano/utils/pango';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  private codeItemSettings: Gio.Settings;
  private label: St.Label;
  private language: string;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem, language: string) {
    super(ext, clipboardManager, dbItem);
    this.language = language;
    this.codeItemSettings = this.settings.get_child('code-item');

    this.label = new St.Label({
      styleClass: 'pano-item-body-code-content',
      clipToAllocation: true,
    });
    this.label.clutterText.useMarkup = true;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    this.body.add_child(this.label);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.codeItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.codeItemSettings.get_string('header-bg-color');
    const headerColor = this.codeItemSettings.get_string('header-color');
    const bodyBgColor = this.codeItemSettings.get_string('body-bg-color');
    const bodyFontFamily = this.codeItemSettings.get_string('body-font-family');
    const bodyFontSize = this.codeItemSettings.get_int('body-font-size');
    const characterLength = this.codeItemSettings.get_int('char-length');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor}`);
    this.label.set_style(`font-size: ${bodyFontSize}px; font-family: ${bodyFontFamily};`);

    const markup = markupCode(this.language, this.dbItem.content.trim(), characterLength);

    if (!markup) {
      throw new Error("Couldn't generate markup");
    }

    this.label.clutterText.set_markup(markup);
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

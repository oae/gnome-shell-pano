import { Settings } from '@gi-types/gio2';
import { EllipsizeMode } from '@gi-types/pango1';
import { Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { markupCode } from '@pano/utils/pango';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  private codeItemSettings: Settings;
  private label: Label;

  constructor(dbItem: DBItem) {
    super(dbItem);

    this.codeItemSettings = this.settings.get_child('code-item');

    this.label = new Label({
      style_class: 'pano-item-body-code-content',
      clip_to_allocation: true,
    });
    this.label.clutter_text.use_markup = true;
    this.label.clutter_text.ellipsize = EllipsizeMode.END;
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

    this.label.clutter_text.set_markup(markupCode(this.dbItem.content, characterLength));
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

import Gio from '@girs/gio-2.0';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import type PanoExtension from '@pano/extension';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  private codeItemSettings: Gio.Settings;
  private label: St.Label;
  private _language: string | undefined;

  constructor(
    ext: PanoExtension,
    clipboardManager: ClipboardManager,
    dbItem: DBItem,
    initialMarkdown: string,
    language: undefined | string,
  ) {
    super(ext, clipboardManager, dbItem);
    this.codeItemSettings = this.settings.get_child('code-item');

    this.label = new St.Label({
      styleClass: 'pano-item-body-code-content',
      clipToAllocation: true,
    });

    this._language = language;
    this.label.clutterText.useMarkup = true;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    this.body.add_child(this.label);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setMarkDown(initialMarkdown);
    this.codeItemSettings.connect('changed', () => {
      const characterLength = this.codeItemSettings.get_int('char-length');

      if (!this._language) {
        return;
      }

      void ext.markdownDetector
        ?.markupCode(this._language, this.dbItem.content.trim(), characterLength)
        .then((markdown) => {
          if (markdown) {
            this.setMarkDown.call(this, markdown);
          }
        });
    });
  }

  public set language(language: string | undefined) {
    this._language = language;
  }

  public setMarkDown(markup: string) {
    const headerBgColor = this.codeItemSettings.get_string('header-bg-color');
    const headerColor = this.codeItemSettings.get_string('header-color');
    const bodyBgColor = this.codeItemSettings.get_string('body-bg-color');
    const bodyFontFamily = this.codeItemSettings.get_string('body-font-family');
    const bodyFontSize = this.codeItemSettings.get_int('body-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor}`);
    this.label.set_style(`font-size: ${bodyFontSize}px; font-family: ${bodyFontFamily};`);

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

import Gio from '@girs/gio-2.0';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import type PanoExtension from '@pano/extension';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { type CodeMetaData, DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { logger, safeParse } from '@pano/utils/shell';

const debug = logger('code-pano-item');

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  private codeItemSettings: Gio.Settings;
  private label: St.Label;
  private metaData: CodeMetaData;

  constructor(ext: PanoExtension, clipboardManager: ClipboardManager, dbItem: DBItem, initialMarkdown: string) {
    super(ext, clipboardManager, dbItem);
    this.codeItemSettings = this.settings.get_child('code-item');

    this.label = new St.Label({
      styleClass: 'pano-item-body-code-content',
      clipToAllocation: true,
    });

    this.metaData = this.extractMetadata();

    this.label.clutterText.useMarkup = true;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    this.body.add_child(this.label);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setMarkDown(initialMarkdown);
    this.codeItemSettings.connect('changed', () => {
      const characterLength = this.codeItemSettings.get_int('char-length');
      ext.markdownDetector
        ?.markupCode(this.metaData.language, this.dbItem.content.trim(), characterLength)
        .then((markdown) => {
          if (markdown) {
            this.setMarkDown.call(this, markdown);
          }
        })
        .catch((err) => {
          debug(`an error occured while trying to markup Code: ${err}`);
        });
    });
  }

  private extractMetadata(): CodeMetaData {
    return safeParse<CodeMetaData>(this.dbItem.metaData || '{"language": "", "highlighter": ""}', {
      language: '',
      highlighter: '',
    });
  }

  public setDBItem(dbItem: DBItem) {
    this.dbItem = dbItem;
    this.metaData = this.extractMetadata();
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

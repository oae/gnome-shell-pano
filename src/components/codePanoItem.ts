import Gio from '@girs/gio-2.0';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import type PanoExtension from '@pano/extension';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { type CodeMetaData, DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PangoMarkdown } from '@pano/utils/pango';
import { logger, safeParse } from '@pano/utils/shell';

const debug = logger('code-pano-item');

export type CodeStyleType = 'code' | 'text';

//TODO: display the language and maybe icons in the header

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  private codeItemSettings: Gio.Settings;
  private textItemSettings: Gio.Settings;
  private label: St.Label;
  private metaData: CodeMetaData;
  private _type: CodeStyleType = 'text';

  constructor(ext: PanoExtension, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);
    this.codeItemSettings = this.settings.get_child('code-item');
    this.textItemSettings = this.settings.get_child('text-item');

    this.label = new St.Label({
      styleClass: 'pano-item-body-code-content',
      clipToAllocation: true,
    });

    this.metaData = this.extractMetadata();

    this.label.clutterText.useMarkup = true;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;
    this.body.add_child(this.label);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setTextStyle();

    this.textItemSettings.connect('changed', () => {
      if (this._type !== 'text') {
        return;
      }

      this.setTextStyle();
    });

    this.codeItemSettings.connect('changed', (_source, key) => {
      if (key === 'code-highlighter-enabled') {
        const isEnabled = this.codeItemSettings.get_boolean('code-highlighter-enabled');

        if (!isEnabled) {
          this._type = 'text';
          void ext.markdownDetector?.cancelAllScheduled();
          this.setTextStyle();
          return;
        }

        this._type = 'code';
      }

      if (this._type !== 'code') {
        return;
      }

      if (key === 'code-highlighter') {
        //TODO. we only have one highlighter atm, but here we need to rescan the metaData in the future
      }

      if (!ext.markdownDetector) {
        //TODO: when there are more ones, it could be, that we are currently scanning of some sort, so this might return null, check getmarkdownDetector()  and add initialized calls to detectHighlighter
        this._type = 'text';
        this.setTextStyle();
        return;
      }

      if (
        key === 'char-length' ||
        key === PangoMarkdown.getSchemaKeyForOptions(ext.markdownDetector.currentHighlighter!) ||
        key === 'code-highlighter-enabled'
      ) {
        const characterLength = this.codeItemSettings.get_int('char-length');
        ext.markdownDetector
          ?.scheduleMarkupCode(this.metaData.language, this.dbItem.content.trim(), characterLength)
          .then((markdown) => {
            // if our style changed, after the initial call, after all this might take some time (Since it's scheduled)
            if ((this._type = 'text')) {
              return;
            }

            if (!markdown) {
              debug('Failed to get markdown from code item, using not highlighted text');
              return;
            }

            this.setCodeStyle(markdown);
          })
          .catch((err) => {
            // if our style changed, after the initial call, after all this might take some time (since it's scheduled)
            if ((this._type = 'text')) {
              return;
            }

            debug(`an error occurred while trying to markup Code: ${err}`);
          });

        return;
      }

      this.setCodeStyle(undefined);
    });
  }

  private extractMetadata(): CodeMetaData {
    return safeParse<CodeMetaData>(this.dbItem.metaData || '{"language": "", "highlighter": ""}', {
      language: '',
      highlighter: '',
    });
  }

  public set type(type: CodeStyleType) {
    this._type = type;
  }

  public setDBItem(dbItem: DBItem) {
    this.dbItem = dbItem;
    this.metaData = this.extractMetadata();
  }

  public setCodeStyle(markdown: string | undefined) {
    const headerBgColor = this.codeItemSettings.get_string('header-bg-color');
    const headerColor = this.codeItemSettings.get_string('header-color');
    const bodyBgColor = this.codeItemSettings.get_string('body-bg-color');
    const bodyFontFamily = this.codeItemSettings.get_string('body-font-family');
    const bodyFontSize = this.codeItemSettings.get_int('body-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor}`);
    this.label.set_style(`font-size: ${bodyFontSize}px; font-family: ${bodyFontFamily};`);

    if (markdown) {
      this.label.clutterText.set_markup(markdown);
    }
  }

  public setMarkDown(markdown: string) {
    this.setCodeStyle(markdown);
  }

  private setTextStyle() {
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

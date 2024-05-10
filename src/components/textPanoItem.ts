import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-16';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { getItemBackgroundColor } from '@pano/utils/color';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class TextPanoItem extends PanoItem {
  private textItemSettings: Gio.Settings;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.textItemSettings = this.settings.get_child('text-item');

    this.label = new St.Label({
      styleClass: 'pano-item-body-text-content',
    });
    this.label.clutterText.lineWrap = true;
    this.label.clutterText.lineWrapMode = Pango.WrapMode.WORD_CHAR;
    this.label.clutterText.ellipsize = Pango.EllipsizeMode.END;

    this.body.add_child(this.label);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.textItemSettings.connect('changed', this.setStyle.bind(this));

    // Settings for controls
    this.settings.connect('changed::is-in-incognito', this.setStyle.bind(this));
    this.settings.connect('changed::incognito-window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::enable-headers', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.textItemSettings.get_string('header-bg-color');
    const headerColor = this.textItemSettings.get_string('header-color');
    const bodyBgColor = this.textItemSettings.get_string('body-bg-color');
    const bodyColor = this.textItemSettings.get_string('body-color');
    const bodyFontFamily = this.textItemSettings.get_string('body-font-family');
    const bodyFontSize = this.textItemSettings.get_int('body-font-size');
    const characterLength = this.textItemSettings.get_int('char-length');

    // Set overlay styles
    this.overlay.setControlsBackground(getItemBackgroundColor(this.settings, headerBgColor, bodyBgColor));

    // Set header styles
    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);

    // Set body styles
    this.container.set_style(`background-color: ${bodyBgColor}`);

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

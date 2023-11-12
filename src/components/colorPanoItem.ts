import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class ColorPanoItem extends PanoItem {
  private colorItemSettings: Gio.Settings;
  private label: St1.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.body.add_style_class_name('pano-item-body-color');

    this.colorItemSettings = this.settings.get_child('color-item');

    const colorContainer = new St1.BoxLayout({
      vertical: false,
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.FILL,
      x_align: Clutter.ActorAlign.FILL,
      style_class: 'color-container',
      style: `background-color: ${this.dbItem.content};`,
    });

    this.label = new St1.Label({
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      x_expand: true,
      y_expand: true,
      text: this.dbItem.content,
      style_class: 'color-label',
    });

    colorContainer.add_child(this.label);

    colorContainer.add_constraint(
      new Clutter.AlignConstraint({
        source: this,
        align_axis: Clutter.AlignAxis.Y_AXIS,
        factor: 0.005,
      }),
    );

    this.body.add_child(colorContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.colorItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.colorItemSettings.get_string('header-bg-color');
    const headerColor = this.colorItemSettings.get_string('header-color');
    const metadataBgColor = this.colorItemSettings.get_string('metadata-bg-color');
    const metadataColor = this.colorItemSettings.get_string('metadata-color');
    const metadataFontFamily = this.colorItemSettings.get_string('metadata-font-family');
    const metadataFontSize = this.colorItemSettings.get_int('metadata-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.label.set_style(
      `background-color: ${metadataBgColor}; color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`,
    );
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

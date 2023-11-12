import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import Pango from '@girs/pango-1.0';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;
  private fileItemSettings: Gio.Settings;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.fileList = JSON.parse(this.dbItem.content);
    this.operation = this.dbItem.metaData || 'copy';

    this.body.add_style_class_name('pano-item-body-file');

    this.fileItemSettings = this.settings.get_child('file-item');

    const container = new St1.BoxLayout({
      style_class: 'copied-files-container',
      vertical: true,
      x_expand: true,
      y_expand: false,
      y_align: Clutter.ActorAlign.FILL,
    });

    this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]);
      })
      .forEach((uri) => {
        const bl = new St1.BoxLayout({
          vertical: false,
          style_class: 'copied-file-name',
          x_expand: true,
          x_align: Clutter.ActorAlign.FILL,
          clip_to_allocation: true,
          y_align: Clutter.ActorAlign.FILL,
        });
        bl.add_child(
          new St1.Icon({
            icon_name: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
            x_align: Clutter.ActorAlign.START,
            icon_size: 14,
            style_class: 'file-icon',
          }),
        );
        const uriLabel = new St1.Label({
          text: uri,
          style_class: 'pano-item-body-file-name-label',
          x_align: Clutter.ActorAlign.FILL,
          x_expand: true,
        });
        uriLabel.clutter_text.ellipsize = Pango.EllipsizeMode.MIDDLE;
        bl.add_child(uriLabel);
        container.add_child(bl);
      });

    this.body.add_child(container);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.fileItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.fileItemSettings.get_string('header-bg-color');
    const headerColor = this.fileItemSettings.get_string('header-color');
    const bodyBgColor = this.fileItemSettings.get_string('body-bg-color');
    const bodyColor = this.fileItemSettings.get_string('body-color');
    const bodyFontFamily = this.fileItemSettings.get_string('body-font-family');
    const bodyFontSize = this.fileItemSettings.get_int('body-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(
      `background-color: ${bodyBgColor}; color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px;`,
    );
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.FILE,
        value: { fileList: this.fileList, operation: this.operation },
      }),
    );
  }
}

import { ActorAlign } from '@gi-types/clutter10';
import { Settings } from '@gi-types/gio2';
import { EllipsizeMode } from '@gi-types/pango1';
import { BoxLayout, Icon, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;
  private fileItemSettings: Settings;

  constructor(dbItem: DBItem) {
    super(dbItem);

    this.fileList = JSON.parse(this.dbItem.content);
    this.operation = this.dbItem.metaData || 'copy';

    this.body.add_style_class_name('pano-item-body-file');

    this.fileItemSettings = this.settings.get_child('file-item');

    const container = new BoxLayout({
      style_class: 'copied-files-container',
      vertical: true,
      x_expand: true,
      y_expand: false,
      y_align: ActorAlign.FILL,
    });

    this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]);
      })
      .forEach((uri) => {
        const bl = new BoxLayout({
          vertical: false,
          style_class: 'copied-file-name',
          x_expand: true,
          x_align: ActorAlign.FILL,
          clip_to_allocation: true,
          y_align: ActorAlign.FILL,
        });
        bl.add_child(
          new Icon({
            icon_name: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
            x_align: ActorAlign.START,
            icon_size: 14,
            style_class: 'file-icon',
          }),
        );
        const uriLabel = new Label({
          text: uri,
          style_class: 'pano-item-body-file-name-label',
          x_align: ActorAlign.FILL,
          x_expand: true,
        });
        uriLabel.clutter_text.ellipsize = EllipsizeMode.MIDDLE;
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
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.FILE,
        value: { fileList: this.fileList, operation: this.operation },
      }),
    );
  }
}

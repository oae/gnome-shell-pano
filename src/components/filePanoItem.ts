import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { DBItem, type FileContentList } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { safeParse } from '@pano/utils/shell';

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;
  private fileItemSettings: Gio.Settings;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.fileList = safeParse<FileContentList>(this.dbItem.content, []);
    this.operation = this.dbItem.metaData || 'copy';

    this.body.add_style_class_name('pano-item-body-file');

    this.fileItemSettings = this.settings.get_child('file-item');

    const container = new St.BoxLayout({
      styleClass: 'copied-files-container',
      vertical: true,
      xExpand: true,
      yExpand: false,
      yAlign: Clutter.ActorAlign.FILL,
    });

    this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]!);
      })
      .forEach((uri) => {
        const bl = new St.BoxLayout({
          vertical: false,
          styleClass: 'copied-file-name',
          xExpand: true,
          xAlign: Clutter.ActorAlign.FILL,
          clipToAllocation: true,
          yAlign: Clutter.ActorAlign.FILL,
        });
        bl.add_child(
          new St.Icon({
            iconName: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
            xAlign: Clutter.ActorAlign.START,
            iconSize: 14,
            styleClass: 'file-icon',
          }),
        );
        const uriLabel = new St.Label({
          text: uri,
          styleClass: 'pano-item-body-file-name-label',
          xAlign: Clutter.ActorAlign.FILL,
          xExpand: true,
        });
        uriLabel.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;
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

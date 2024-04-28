import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-14';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;
  private fileItemSettings: Gio.Settings;
  private titleContainer: St.BoxLayout;
  private copiedFilesContainer: St.BoxLayout;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.fileList = JSON.parse(this.dbItem.content);
    this.operation = this.dbItem.metaData || 'copy';

    this.fileItemSettings = this.settings.get_child('file-item');

    this.titleContainer = new St.BoxLayout({
      styleClass: 'title-container',
      vertical: false,
      xExpand: true,
      yExpand: false,
      yAlign: Clutter.ActorAlign.START,
    });

    const icon = new St.Icon({
      xAlign: Clutter.ActorAlign.START,
      styleClass: 'title-icon',
    });

    if (this.operation === FileOperation.CUT) {
      icon.iconName = 'edit-cut-symbolic';
    } else {
      icon.gicon = Gio.icon_new_for_string(`${ext.path}/icons/hicolor/scalable/actions/paper-filled-symbolic.svg`);
    }

    const label = new St.Label({
      text: this.fileList.length > 1 ? `${this.fileList.length} files` : `${this.fileList.length} file`,
      styleClass: 'title-label',
      xAlign: Clutter.ActorAlign.FILL,
      xExpand: true,
    });

    this.titleContainer.add_child(icon);
    this.titleContainer.add_child(label);

    this.copiedFilesContainer = new St.BoxLayout({
      styleClass: 'copied-files-container',
      vertical: true,
      xExpand: true,
      yExpand: false,
      yAlign: Clutter.ActorAlign.FILL,
    });

    // Check for the common parent directory for all files
    const commonDirectory = this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]!).split('/');
      })
      .reduce((prev, cur) => {
        for (let i = 0; i < Math.min(prev.length, cur.length); i++) {
          if (prev[i] !== cur[i]) {
            return prev.slice(0, i);
          }
        }

        // Two files are the same
        if (prev.length === cur.length) {
          return prev.slice(0, prev.length - 1);
        }

        // One file/directory is inside of the other directory
        return prev.length < cur.length ? prev : cur;
      })
      .join('/');

    if (this.fileList.length > 1) {
      const directoryLabel = new St.Label({
        text: commonDirectory,
        styleClass: 'top-level-directory',
        xAlign: Clutter.ActorAlign.FILL,
        xExpand: true,
      });
      directoryLabel.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;

      this.copiedFilesContainer.add_child(directoryLabel);
    }

    this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]!);
      })
      .forEach((uri, i) => {
        const bl = new St.BoxLayout({
          vertical: false,
          styleClass: 'copied-file-name',
          xExpand: true,
          xAlign: Clutter.ActorAlign.FILL,
          clipToAllocation: true,
          yAlign: Clutter.ActorAlign.FILL,
        });

        const iconName = i < this.fileList.length - 1 ? 'file-tree-middle' : 'file-tree-end';
        const icon = new St.Icon({
          gicon: Gio.icon_new_for_string(`${ext.path}/icons/hicolor/scalable/actions/${iconName}-symbolic.svg`),
          styleClass: 'file-tree-icon',
          xAlign: Clutter.ActorAlign.START,
          xExpand: false,
        });

        const uriLabel = new St.Label({
          text: this.fileList.length == 1 ? uri : uri.substring(commonDirectory.length + 1),
          styleClass: 'file-label',
          xAlign: Clutter.ActorAlign.FILL,
          yAlign: Clutter.ActorAlign.CENTER,
          xExpand: true,
        });

        uriLabel.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;
        if (this.fileList.length == 1) {
          uriLabel.clutterText.lineWrap = true;
        } else {
          bl.add_child(icon);
        }

        bl.add_child(uriLabel);
        this.copiedFilesContainer.add_child(bl);
      });

    this.body.add_child(this.titleContainer);
    this.body.add_child(this.copiedFilesContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.fileItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const bodyBgColor = this.fileItemSettings.get_string('body-bg-color');
    const titleColor = this.fileItemSettings.get_string('title-color');
    const titleFontFamily = this.fileItemSettings.get_string('title-font-family');
    const titleFontSize = this.fileItemSettings.get_int('title-font-size');
    const bodyColor = this.fileItemSettings.get_string('body-color');
    const bodyFontFamily = this.fileItemSettings.get_string('body-font-family');
    const bodyFontSize = this.fileItemSettings.get_int('body-font-size');

    this.body.set_style(`background-color: ${bodyBgColor};`);

    this.titleContainer.set_style(
      `color: ${titleColor}; font-family: ${titleFontFamily}; font-size: ${titleFontSize}px;`,
    );
    this.copiedFilesContainer.set_style(
      `color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px`,
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

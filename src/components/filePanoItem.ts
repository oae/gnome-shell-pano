import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-16';
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
  private copiedFilesContainer: St.BoxLayout | null = null;
  private preview: St.BoxLayout | St.Label | null = null;

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
      yAlign: Clutter.ActorAlign.FILL,
    });

    const icon = new St.Icon({
      xAlign: Clutter.ActorAlign.START,
      yAlign: Clutter.ActorAlign.START,
      styleClass: 'title-icon',
    });

    if (this.operation === FileOperation.CUT) {
      icon.iconName = 'edit-cut-symbolic';
    } else {
      icon.gicon = Gio.icon_new_for_string(`${ext.path}/icons/hicolor/scalable/actions/paper-filled-symbolic.svg`);
    }

    const label = new St.Label({
      styleClass: 'title-label',
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.CENTER,
      xExpand: true,
    });
    label.clutterText.lineWrap = true;
    label.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;

    this.titleContainer.add_child(icon);

    const homeDir = GLib.get_home_dir();

    if (this.fileList.length === 1) {
      const items = this.fileList[0]!.split('://').filter((c) => !!c);
      label.text = decodeURIComponent(items[items.length - 1]!).replace(homeDir, '~');

      this.titleContainer.add_child(label);
      this.body.add_child(this.titleContainer);

      // Try to create file preview
      const file = Gio.File.new_for_uri(this.fileList[0]!);
      if (file.query_exists(null)) {
        // Read first 64 bytes of the file to guess the content type for files without an extension
        let data: Uint8Array | null = null;
        let fileStream: Gio.FileInputStream | null = null;
        try {
          if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.REGULAR) {
            fileStream = file.read(null);
            data = fileStream.read_bytes(64, null).toArray();
          }
        } finally {
          fileStream?.close(null);
        }

        const contentType = Gio.content_type_guess(this.fileList[0]!, data)[0];

        if (Gio.content_type_is_a(contentType, 'text/plain')) {
          // Text
          let fileStream: Gio.FileInputStream | null = null;
          try {
            fileStream = file.read(null);
            const stream = new Gio.DataInputStream({ baseStream: fileStream });

            let text = '';
            for (let i = 0; i < 30; i++) {
              const line = stream.read_line_utf8(null)[0];
              if (line !== null) {
                if (i > 0) text += '\n';
                text += line;
              } else {
                break;
              }
            }

            this.preview = new St.Label({
              text: text,
              styleClass: 'copied-file-preview copied-file-preview-text',
              xExpand: true,
              yExpand: true,
              xAlign: Clutter.ActorAlign.FILL,
              yAlign: Clutter.ActorAlign.FILL,
              minHeight: 0,
            });
            this.preview.clutterText.lineWrap = false;
            this.preview.clutterText.ellipsize = Pango.EllipsizeMode.END;
          } catch (e) {
            console.error(e);
          } finally {
            fileStream?.close(null);
          }
        } else if (Gio.content_type_is_a(contentType, 'image/*')) {
          // Images
          this.preview = new St.BoxLayout({
            styleClass: 'copied-file-preview copied-file-preview-image',
            xExpand: true,
            yExpand: true,
            xAlign: Clutter.ActorAlign.FILL,
            yAlign: Clutter.ActorAlign.FILL,
            style: `background-image: url(${this.fileList[0]!}); background-size: cover;`,
          });
        } else {
          // Other files that might have a thumbnail available i.e. videos or pdf files
          const md5 = GLib.compute_checksum_for_string(
            GLib.ChecksumType.MD5,
            this.fileList[0]!,
            this.fileList[0]!.length,
          );

          const thumbnail1 = Gio.File.new_for_path(`${homeDir}/.thumbnails/${md5}.png`);
          const thumbnail2 = Gio.File.new_for_path(`${homeDir}/.cache/thumbnails/large/${md5}.png`);
          const uri = thumbnail1.query_exists(null)
            ? thumbnail1.get_uri()
            : thumbnail2.query_exists(null)
              ? thumbnail2.get_uri()
              : null;

          if (uri) {
            this.preview = new St.BoxLayout({
              styleClass: 'copied-file-preview copied-file-preview-image',
              xExpand: true,
              yExpand: true,
              xAlign: Clutter.ActorAlign.FILL,
              yAlign: Clutter.ActorAlign.FILL,
              style: `background-image: url(${uri}); background-size: cover;`,
            });
          } else {
            this.add_style_class_name('no-preview');
          }
        }

        if (this.preview) {
          this.preview.visible = this.settings.get_boolean('compact-mode');
          this.body.add_child(this.preview);
        }
      }
    } else {
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

      label.text = `${commonDirectory.replace(homeDir, '~')}`;

      const labelContainer = new St.BoxLayout({
        vertical: true,
        xExpand: true,
        yExpand: false,
        xAlign: Clutter.ActorAlign.FILL,
        yAlign: Clutter.ActorAlign.CENTER,
      });
      labelContainer.add_child(label);
      labelContainer.add_child(
        new St.Label({
          text: `${this.fileList.length} items`,
          styleClass: 'copied-files-count',
        }),
      );

      this.titleContainer.add_child(labelContainer);
      this.body.add_child(this.titleContainer);

      this.copiedFilesContainer = new St.BoxLayout({
        styleClass: 'copied-files-container',
        clipToAllocation: true,
        vertical: true,
        xExpand: true,
        yExpand: true,
        yAlign: Clutter.ActorAlign.FILL,
        minHeight: 0,
      });

      this.fileList
        .map((f) => {
          const items = f.split('://').filter((c) => !!c);
          return decodeURIComponent(items[items.length - 1]!);
        })
        .forEach((uri) => {
          const uriLabel = new St.Label({
            text: uri.substring(commonDirectory.length + 1).replace(homeDir, '~'),
            styleClass: 'copied-file-name',
            xAlign: Clutter.ActorAlign.FILL,
            xExpand: true,
          });
          uriLabel.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;

          this.copiedFilesContainer!.add_child(uriLabel);
        });

      this.body.add_child(this.copiedFilesContainer);
    }

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.settings.connect('changed::enable-headers', this.setStyle.bind(this));
    this.settings.connect('changed::compact-mode', this.setStyle.bind(this));
    this.fileItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const compactMode = this.settings.get_boolean('compact-mode');
    const headerBgColor = this.fileItemSettings.get_string('header-bg-color');
    const headerColor = this.fileItemSettings.get_string('header-color');
    const bodyBgColor = this.fileItemSettings.get_string('body-bg-color');
    const titleColor = this.fileItemSettings.get_string('title-color');
    const titleFontFamily = this.fileItemSettings.get_string('title-font-family');
    const titleFontSize = this.fileItemSettings.get_int('title-font-size');
    const bodyColor = this.fileItemSettings.get_string('body-color');
    const bodyFontFamily = this.fileItemSettings.get_string('body-font-family');
    const bodyFontSize = this.fileItemSettings.get_int('body-font-size');
    const previewBgColor = this.fileItemSettings.get_string('preview-bg-color');
    const previewColor = this.fileItemSettings.get_string('preview-color');
    const previewFontFamily = this.fileItemSettings.get_string('preview-font-family');
    const previewFontSize = this.fileItemSettings.get_int('preview-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.container.set_style(`background-color: ${bodyBgColor};`);

    this.titleContainer.set_style(
      `color: ${titleColor}; font-family: ${titleFontFamily}; font-size: ${titleFontSize}px;`,
    );

    if (this.copiedFilesContainer) {
      this.copiedFilesContainer.visible = !compactMode;
      this.copiedFilesContainer?.set_style(
        `background-color: ${previewBgColor}; color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px`,
      );
    }

    this.titleContainer.vertical = this.preview === null && this.copiedFilesContainer === null && !compactMode;
    if (this.preview) {
      this.preview.visible = !compactMode;
    }

    if (this.preview?.styleClass.endsWith('copied-file-preview-text')) {
      this.preview.set_style(
        `background-color: ${previewBgColor}; color: ${previewColor}; font-family: ${previewFontFamily}; font-size: ${previewFontSize}px;`,
      );
    }
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

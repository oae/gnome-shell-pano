import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Pango from '@girs/pango-1.0';
import St from '@girs/st-16';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { getItemBackgroundColor } from '@pano/utils/color';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';
import { isVisible } from '@pano/utils/ui';

enum PreviewType {
  NONE = 'none',
  FILES = 'files',
  IMAGE = 'image',
  TEXT = 'text',
}

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;
  private fileItemSettings: Gio.Settings;
  private titleContainer: St.BoxLayout;
  private icon: St.Icon;
  private preview: St.BoxLayout | St.Label | null = null;
  private previewType: PreviewType = PreviewType.NONE;
  private pasteContent: boolean = false;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);
    const _ = gettext(ext);

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

    this.icon = new St.Icon({
      gicon: Gio.icon_new_for_string(
        this.operation === FileOperation.CUT
          ? 'edit-cut-symbolic'
          : `${ext.path}/icons/hicolor/scalable/actions/paper-filled-symbolic.svg`,
      ),
      xAlign: Clutter.ActorAlign.START,
      yAlign: Clutter.ActorAlign.START,
      styleClass: 'title-icon',
    });
    this.header.setIcon(this.icon.gicon);

    const label = new St.Label({
      styleClass: 'title-label',
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.CENTER,
      xExpand: true,
    });
    label.clutterText.lineWrap = true;
    label.clutterText.ellipsize = Pango.EllipsizeMode.MIDDLE;

    this.titleContainer.add_child(this.icon);

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
          const text = FilePanoItem.getFileContents(file, 32);
          if (text !== null) {
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
            this.previewType = PreviewType.TEXT;

            const pasteFileContentIcon = new St.Icon({
              iconName: 'preferences-desktop-font-symbolic',
              styleClass: 'pano-item-action-button-icon',
            });

            const pasteFileContentButton = new St.Button({
              styleClass: 'pano-item-action-button pano-item-paste-content-button',
              child: pasteFileContentIcon,
            });

            pasteFileContentButton.connect('clicked', () => {
              this.pasteContent = true;
              this.emit('activated');
              return Clutter.EVENT_STOP;
            });

            this.overlay.actionContainer.insert_child_at_index(pasteFileContentButton, 0);
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
          this.previewType = PreviewType.IMAGE;
        } else {
          // Other files that might have a thumbnail available i.e. videos or pdf files
          const thumbnail = FilePanoItem.getThumbnail(homeDir, this.fileList[0]!);
          if (thumbnail !== null) {
            this.preview = new St.BoxLayout({
              styleClass: 'copied-file-preview copied-file-preview-image',
              xExpand: true,
              yExpand: true,
              xAlign: Clutter.ActorAlign.FILL,
              yAlign: Clutter.ActorAlign.FILL,
              style: `background-image: url(${thumbnail.get_uri()}); background-size: cover;`,
            });
            this.previewType = PreviewType.IMAGE;
          }
        }

        if (this.preview) {
          this.preview.visible = this.settings.get_boolean('compact-mode');
          this.body.add_child(this.preview);
        } else {
          this.add_style_class_name('no-preview');
        }
      } else {
        this.add_style_class_name('no-preview');
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
        yAlign: Clutter.ActorAlign.FILL,
      });
      labelContainer.add_child(label);
      labelContainer.add_child(
        new St.Label({
          text: `${this.fileList.length} ${_('items')}`,
          styleClass: 'copied-files-count',
          yAlign: Clutter.ActorAlign.FILL,
        }),
      );

      this.titleContainer.add_child(labelContainer);
      this.body.add_child(this.titleContainer);

      this.preview = new St.BoxLayout({
        styleClass: 'copied-file-preview copied-file-preview-files',
        clipToAllocation: true,
        vertical: true,
        xExpand: true,
        yExpand: true,
        yAlign: Clutter.ActorAlign.FILL,
        minHeight: 0,
      });
      this.previewType = PreviewType.FILES;

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

          this.preview!.add_child(uriLabel);
        });

      this.body.add_child(this.preview);
    }

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.settings.connect('changed::compact-mode', this.setStyle.bind(this));
    this.settings.connect('changed::header-style', this.setStyle.bind(this));
    this.fileItemSettings.connect('changed', this.setStyle.bind(this));

    // Settings for controls
    this.settings.connect('changed::is-in-incognito', this.setStyle.bind(this));
    this.settings.connect('changed::incognito-window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::window-background-color', this.setStyle.bind(this));
  }

  private setStyle() {
    const compactMode = this.settings.get_boolean('compact-mode');
    const headerStyle = this.settings.get_uint('header-style');
    const headerBgColor = this.fileItemSettings.get_string('header-bg-color');
    const headerColor = this.fileItemSettings.get_string('header-color');
    const bodyBgColor = this.fileItemSettings.get_string('body-bg-color');
    const titleColor = this.fileItemSettings.get_string('title-color');
    const titleFontFamily = this.fileItemSettings.get_string('title-font-family');
    const titleFontSize = this.fileItemSettings.get_int('title-font-size');
    const filesPreviewBgColor = this.fileItemSettings.get_string('files-preview-bg-color');
    const filesPreviewColor = this.fileItemSettings.get_string('files-preview-color');
    const filesPreviewFontFamily = this.fileItemSettings.get_string('files-preview-font-family');
    const filesPreviewFontSize = this.fileItemSettings.get_int('files-preview-font-size');
    const textPreviewBgColor = this.fileItemSettings.get_string('text-preview-bg-color');
    const textPreviewColor = this.fileItemSettings.get_string('text-preview-color');
    const textPreviewFontFamily = this.fileItemSettings.get_string('text-preview-font-family');
    const textPreviewFontSize = this.fileItemSettings.get_int('text-preview-font-size');

    this.overlay.setControlsBackground(getItemBackgroundColor(this.settings, headerBgColor, bodyBgColor));
    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.container.set_style(`background-color: ${bodyBgColor};`);

    this.titleContainer.set_style(
      `color: ${titleColor}; font-family: ${titleFontFamily}; font-size: ${titleFontSize}px;`,
    );
    this.titleContainer.vertical = this.preview === null && !compactMode;

    // Switch title and icon
    if (compactMode !== (this.titleContainer.firstChild !== this.icon)) {
      const children = this.titleContainer.get_children();
      this.titleContainer.remove_all_children();
      this.titleContainer.add_child(children[1]!);
      this.titleContainer.add_child(children[0]!);
    }

    this.icon.visible = !isVisible(headerStyle);

    if (this.preview) {
      this.preview.visible = !compactMode;

      if (this.previewType === PreviewType.FILES) {
        this.preview.set_style(
          `background-color: ${filesPreviewBgColor}; color: ${filesPreviewColor}; font-family: ${filesPreviewFontFamily}; font-size: ${filesPreviewFontSize}px;`,
        );
      } else if (this.previewType === PreviewType.TEXT) {
        this.preview.set_style(
          `background-color: ${textPreviewBgColor}; color: ${textPreviewColor}; font-family: ${textPreviewFontFamily}; font-size: ${textPreviewFontSize}px;`,
        );
      }
    }
  }

  private setClipboardContent(): void {
    if (this.pasteContent) {
      const file = Gio.File.new_for_uri(this.fileList[0]!);
      const text = FilePanoItem.getFileContents(file);

      if (text !== null) {
        this.clipboardManager.setContent(
          new ClipboardContent({
            type: ContentType.TEXT,
            value: text,
          }),
          false,
        );
        return;
      }

      this.pasteContent = false;
    }

    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.FILE,
        value: { fileList: this.fileList, operation: this.operation },
      }),
    );
  }

  override vfunc_key_press_event(event: Clutter.Event): boolean {
    if (
      this.previewType === PreviewType.TEXT &&
      (event.get_key_symbol() === Clutter.KEY_Return ||
        event.get_key_symbol() === Clutter.KEY_ISO_Enter ||
        event.get_key_symbol() === Clutter.KEY_KP_Enter) &&
      event.has_control_modifier()
    ) {
      this.pasteContent = true;
      this.emit('activated');
      return Clutter.EVENT_STOP;
    }

    return super.vfunc_key_press_event(event);
  }

  override vfunc_button_release_event(event: Clutter.Event): boolean {
    if (
      this.previewType === PreviewType.TEXT &&
      event.get_button() === Clutter.BUTTON_PRIMARY &&
      event.has_control_modifier()
    ) {
      this.pasteContent = true;
      this.emit('activated');
      return Clutter.EVENT_STOP;
    }

    return super.vfunc_button_release_event(event);
  }

  private static getFileContents(file: Gio.File, n: number | null = null): string | null {
    if (!file.query_exists(null)) {
      return null;
    }

    if (n !== null) {
      let fileStream: Gio.FileInputStream | undefined;
      try {
        fileStream = file.read(null);
        const stream = new Gio.DataInputStream({ baseStream: fileStream });

        let text = '';
        for (let i = 0; i < n; i++) {
          const line = stream.read_line_utf8(null)[0];
          if (line !== null) {
            if (i > 0) text += '\n';
            text += line;
          } else {
            break;
          }
        }

        return text;
      } catch (e) {
        console.error(e);
      } finally {
        fileStream?.close(null);
      }
    } else {
      try {
        const [success, text, _] = file.load_contents(null);
        if (success) {
          return new TextDecoder().decode(text);
        } else {
          throw new Error('failed to load file contents');
        }
      } catch (e) {
        console.error(e);
      }
    }

    return null;
  }

  private static getThumbnail(homeDir: string, file: string): Gio.File | null {
    const md5 = GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, file, file.length);

    try {
      const thumbnailDir = Gio.File.new_for_path(`${homeDir}/.cache/thumbnails`);
      const enumerator = thumbnailDir.enumerate_children('standard::*', 0, null);

      let f: Gio.FileInfo | null = null;
      while ((f = enumerator.next_file(null)) !== null) {
        if (f.get_file_type() == Gio.FileType.DIRECTORY) {
          const thumbnailFile = thumbnailDir.get_child(f.get_name()).get_child(`${md5}.png`);
          if (thumbnailFile.query_exists(null)) {
            return thumbnailFile;
          }
        }
      }
    } catch {
      // ignore
    }

    return null;
  }
}

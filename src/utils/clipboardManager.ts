import { Settings } from '@gi-types/gio2';
import { Bytes } from '@gi-types/glib2';
import { MetaInfo, Object } from '@gi-types/gobject2';
import { Selection, SelectionSource, SelectionType } from '@gi-types/meta10';
import { Global } from '@gi-types/shell0';
import { Clipboard, ClipboardType } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { debounce, getCurrentExtensionSettings, logger } from '@pano/utils/shell';

const global = Global.get();

const debug = logger('clipboard-manager');

const MimeType = {
  TEXT: ['text/plain', 'text/plain;charset=utf-8', 'UTF8_STRING'],
  IMAGE: ['image/png'],
  GNOME_FILE: ['x-special/gnome-copied-files'],
  SENSITIVE: ['x-kde-passwordManagerHint'],
};

export enum ContentType {
  IMAGE,
  FILE,
  TEXT,
}

export const FileOperation = {
  CUT: 'cut',
  COPY: 'copy',
};

export interface FileOperationValue {
  operation: string;
  fileList: string[];
}

type ClipboardContentType =
  | {
      type: ContentType.FILE;
      value: FileOperationValue;
    }
  | {
      type: ContentType.TEXT;
      value: string;
    }
  | {
      type: ContentType.IMAGE;
      value: Uint8Array;
    };

@registerGObjectClass
export class ClipboardContent extends Object {
  static metaInfo: MetaInfo = {
    GTypeName: 'ClipboardContent',
  };
  content: ClipboardContentType;

  constructor(content: ClipboardContentType) {
    super();
    this.content = content;
  }
}

const arraybufferEqual = (buf1: Uint8Array, buf2: Uint8Array) => {
  if (buf1 === buf2) {
    return true;
  }

  if (buf1.byteLength !== buf2.byteLength) {
    return false;
  }

  const view1 = new DataView(buf1);
  const view2 = new DataView(buf2);

  let i = buf1.byteLength;
  while (i--) {
    if (view1.getUint8(i) !== view2.getUint8(i)) {
      return false;
    }
  }

  return true;
};

const compareClipboardContent = (content1: ClipboardContentType, content2: ClipboardContentType | undefined) => {
  if (!content2) {
    return false;
  }
  if (content1.type !== content2.type) {
    return false;
  }
  if (content1.type === ContentType.TEXT) {
    return content1.value === content2.value;
  }
  if (content1.type === ContentType.IMAGE && content2.type === ContentType.IMAGE) {
    return arraybufferEqual(content1.value, content2.value);
  }
  if (content1.type === ContentType.FILE && content2.type === ContentType.FILE) {
    return (
      content1.value.operation === content2.value.operation &&
      content1.value.fileList.length === content2.value.fileList.length &&
      content1.value.fileList.every((file, index) => file === content2.value.fileList[index])
    );
  }
  return false;
};

@registerGObjectClass
export class ClipboardManager extends Object {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoClipboardManager',
    Signals: {
      changed: {
        param_types: [ClipboardContent.$gtype],
        accumulator: 0,
      },
    },
  };

  private clipboard: Clipboard;
  private selection: Selection;
  private selectionChangedId: number;
  public isTracking: boolean;
  private settings: Settings;
  private lastCopiedContent: ClipboardContent | null;

  constructor() {
    super();
    this.settings = getCurrentExtensionSettings();
    this.clipboard = Clipboard.get_default();
    this.selection = global.get_display().get_selection();
    this.lastCopiedContent = null;
  }

  startTracking() {
    this.lastCopiedContent = null;
    this.isTracking = true;
    const primaryTracker = debounce(async () => {
      const result = await this.getContent(ClipboardType.PRIMARY);
      if (!result) {
        return;
      }
      if (compareClipboardContent(result.content, this.lastCopiedContent?.content)) {
        return;
      }

      this.lastCopiedContent = result;
      this.emit('changed', result);
    }, 500);

    this.selectionChangedId = this.selection.connect(
      'owner-changed',
      async (_selection: Selection, selectionType: SelectionType, _selectionSource: SelectionSource) => {
        if (this.settings.get_boolean('is-in-incognito')) {
          return;
        }
        const focussedWindow = Global.get().display.focus_window;
        const wmClass = focussedWindow?.get_wm_class();
        if (
          wmClass &&
          this.settings.get_boolean('watch-exclusion-list') &&
          this.settings
            .get_strv('exclusion-list')
            .map((s) => s.toLowerCase())
            .indexOf(wmClass.toLowerCase()) >= 0
        ) {
          return;
        }
        if (selectionType === SelectionType.SELECTION_CLIPBOARD) {
          try {
            const result = await this.getContent(ClipboardType.CLIPBOARD);
            if (!result) {
              return;
            }
            if (compareClipboardContent(result.content, this.lastCopiedContent?.content)) {
              return;
            }

            this.lastCopiedContent = result;
            this.emit('changed', result);
          } catch (err) {
            debug(`error: ${err}`);
          }
        } else if (selectionType === SelectionType.SELECTION_PRIMARY) {
          try {
            if (this.settings.get_boolean('sync-primary')) {
              primaryTracker();
            }
          } catch (err) {
            debug(`error: ${err}`);
          }
        }
      },
    );
  }

  stopTracking() {
    this.selection.disconnect(this.selectionChangedId);
    this.isTracking = false;
    this.lastCopiedContent = null;
  }

  setContent({ content }: ClipboardContent): void {
    const syncPrimary = this.settings.get_boolean('sync-primary');
    if (content.type === ContentType.TEXT) {
      if (syncPrimary) {
        this.clipboard.set_text(ClipboardType.PRIMARY, content.value);
      }
      this.clipboard.set_text(ClipboardType.CLIPBOARD, content.value);
    } else if (content.type === ContentType.IMAGE) {
      if (syncPrimary) {
        this.clipboard.set_content(ClipboardType.PRIMARY, MimeType.IMAGE[0], content.value);
      }
      this.clipboard.set_content(ClipboardType.CLIPBOARD, MimeType.IMAGE[0], content.value);
    } else if (content.type === ContentType.FILE) {
      if (syncPrimary) {
        this.clipboard.set_content(
          ClipboardType.PRIMARY,
          MimeType.GNOME_FILE[0],
          new TextEncoder().encode([content.value.operation, ...content.value.fileList].join('\n')),
        );
      }
      this.clipboard.set_content(
        ClipboardType.CLIPBOARD,
        MimeType.GNOME_FILE[0],
        new TextEncoder().encode([content.value.operation, ...content.value.fileList].join('\n')),
      );
    }
  }

  private haveMimeType(clipboardMimeTypes: string[], targetMimeTypes: string[]): boolean {
    return clipboardMimeTypes.find((m) => targetMimeTypes.indexOf(m) >= 0) !== undefined;
  }

  private getCurrentMimeType(clipboardMimeTypes: string[], targetMimeTypes: string[]): string | undefined {
    return clipboardMimeTypes.find((m) => targetMimeTypes.indexOf(m) >= 0);
  }

  private async getContent(clipboardType: ClipboardType): Promise<ClipboardContent | null> {
    return new Promise((resolve) => {
      const cbMimeTypes = this.clipboard.get_mimetypes(clipboardType);
      if (this.haveMimeType(cbMimeTypes, MimeType.SENSITIVE)) {
        resolve(null);
        return;
      } else if (this.haveMimeType(cbMimeTypes, MimeType.GNOME_FILE)) {
        const currentMimeType = this.getCurrentMimeType(cbMimeTypes, MimeType.GNOME_FILE);
        if (!currentMimeType) {
          resolve(null);
          return;
        }
        this.clipboard.get_content(clipboardType, currentMimeType, (_, bytes: Bytes | Uint8Array) => {
          const data = bytes instanceof Bytes ? bytes.get_data() : bytes;
          if (data && data.length > 0) {
            const content = new TextDecoder().decode(data);
            const fileContent = content.split('\n').filter((c) => !!c);
            const hasOperation = fileContent[0] === FileOperation.CUT || fileContent[0] === FileOperation.COPY;
            resolve(
              new ClipboardContent({
                type: ContentType.FILE,
                value: {
                  operation: hasOperation ? fileContent[0] : FileOperation.COPY,
                  fileList: hasOperation ? fileContent.slice(1) : fileContent,
                },
              }),
            );
            return;
          }
          resolve(null);
        });
      } else if (this.haveMimeType(cbMimeTypes, MimeType.IMAGE)) {
        const currentMimeType = this.getCurrentMimeType(cbMimeTypes, MimeType.IMAGE);
        if (!currentMimeType) {
          resolve(null);
          return;
        }
        this.clipboard.get_content(clipboardType, currentMimeType, (_, bytes: Bytes | Uint8Array) => {
          const data = bytes instanceof Bytes ? bytes.get_data() : bytes;
          if (data && data.length > 0) {
            resolve(
              new ClipboardContent({
                type: ContentType.IMAGE,
                value: data,
              }),
            );
            return;
          }
          resolve(null);
        });
      } else if (this.haveMimeType(cbMimeTypes, MimeType.TEXT)) {
        this.clipboard.get_text(clipboardType, (_: Clipboard, text: string) => {
          if (text && text.trim()) {
            resolve(
              new ClipboardContent({
                type: ContentType.TEXT,
                value: text.trim(),
              }),
            );
            return;
          }
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });
  }
}

export const clipboardManager = new ClipboardManager();

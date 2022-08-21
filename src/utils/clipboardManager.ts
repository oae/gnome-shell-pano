import { Bytes } from '@imports/glib2';
import { MetaInfo, Object } from '@imports/gobject2';
import { Selection, SelectionType } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { Clipboard, ClipboardType } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { logger } from '@pano/utils/shell';

const global = Global.get();

const debug = logger('clipboard-manager');

const MimeType = {
  TEXT: ['text/plain', 'text/plain;charset=utf-8', 'UTF8_STRING'],
  IMAGE: ['image/png'],
  GNOME_FILE: ['x-special/gnome-copied-files'],
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

  constructor() {
    super();

    this.clipboard = Clipboard.get_default();
    this.selection = global.get_display().get_selection();
  }
  startTracking() {
    this.selectionChangedId = this.selection.connect('owner-changed', async (_, selectionType: SelectionType) => {
      if (selectionType === SelectionType.SELECTION_CLIPBOARD) {
        try {
          const result = await this.getContent();
          if (!result) {
            return;
          }
          this.emit('changed', result);
        } catch (err) {
          debug(`error: ${err}`);
        }
      }
    });
  }

  stopTracking() {
    this.selection.disconnect(this.selectionChangedId);
  }

  setContent({ content }: ClipboardContent): void {
    if (content.type === ContentType.TEXT) {
      this.clipboard.set_text(ClipboardType.CLIPBOARD, content.value);
    } else if (content.type === ContentType.IMAGE) {
      this.clipboard.set_content(ClipboardType.CLIPBOARD, MimeType.IMAGE[0], content.value);
    } else if (content.type === ContentType.FILE) {
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

  private async getContent(): Promise<ClipboardContent | null> {
    return new Promise((resolve) => {
      const cbMimeTypes = this.clipboard.get_mimetypes(ClipboardType.CLIPBOARD);
      if (this.haveMimeType(cbMimeTypes, MimeType.GNOME_FILE)) {
        const currentMimeType = this.getCurrentMimeType(cbMimeTypes, MimeType.GNOME_FILE);
        if (!currentMimeType) {
          resolve(null);
          return;
        }
        this.clipboard.get_content(ClipboardType.CLIPBOARD, currentMimeType, (_, bytes: Bytes | Uint8Array) => {
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
        this.clipboard.get_content(ClipboardType.CLIPBOARD, currentMimeType, (_, bytes: Bytes | Uint8Array) => {
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
        this.clipboard.get_text(ClipboardType.CLIPBOARD, (_: Clipboard, text: string) => {
          if (text) {
            resolve(
              new ClipboardContent({
                type: ContentType.TEXT,
                value: text,
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

import { Bytes } from '@imports/glib2';
import { MetaInfo, Object } from '@imports/gobject2';
import { Selection, SelectionType } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { Clipboard, ClipboardType, Icon } from '@imports/st1';
import { registerGObjectClass } from './gjs';
import { logger } from './shell';

const global = Global.get();

const debug = logger('clipboard-manager');

const MimeType = {
  IMAGE: 'image/png',
  FILE: 'x-special/gnome-copied-files',
};

export enum ContentType {
  IMAGE,
  FILE,
  TEXT,
}

type ClipboardContentType =
  | {
      type: ContentType.FILE;
      value: string[];
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
  private imageContent: Icon;

  constructor() {
    super();

    this.clipboard = Clipboard.get_default();
    this.selection = global.get_display().get_selection();
    this.imageContent = new Icon();
    global.stage.add_actor(this.imageContent);
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

  private async getContent(): Promise<ClipboardContent | null> {
    return new Promise((resolve) => {
      this.clipboard.get_text(ClipboardType.CLIPBOARD, (cb: Clipboard, text: string) => {
        if (text) {
          if (cb.get_mimetypes(ClipboardType.CLIPBOARD).indexOf(MimeType.FILE) >= 0) {
            resolve(
              new ClipboardContent({
                type: ContentType.FILE,
                value: text.split('\n'),
              }),
            );
          } else {
            resolve(
              new ClipboardContent({
                type: ContentType.TEXT,
                value: text,
              }),
            );
          }
          resolve(null);
        } else {
          this.clipboard.get_content(ClipboardType.CLIPBOARD, MimeType.IMAGE, (_, bytes: Bytes | Uint8Array) => {
            if (bytes) {
              if (bytes instanceof Bytes && bytes.get_size() > 0) {
                const data = bytes.get_data();
                if (data) {
                  resolve(
                    new ClipboardContent({
                      type: ContentType.IMAGE,
                      value: data,
                    }),
                  );
                } else {
                  resolve(null);
                }
              } else if (bytes instanceof Uint8Array && bytes.length > 0) {
                resolve(
                  new ClipboardContent({
                    type: ContentType.IMAGE,
                    value: bytes,
                  }),
                );
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        }
      });
    });
  }
}

export const clipboardManager = new ClipboardManager();

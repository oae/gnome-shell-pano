import { Bytes } from '@imports/glib2';
import { MetaInfo, Object, TYPE_STRING } from '@imports/gobject2';
import { Selection, SelectionType } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { Clipboard, ClipboardType } from '@imports/st1';
import { registerGObjectClass } from './gjs';
import { logger } from './shell';

const global = Global.get();
const debug = logger('clipboard-manager');

const MimeTypes = {
  IMAGE: 'image/png',
  FILE: 'x-special/gnome-copied-files',
};

@registerGObjectClass
class ClipboardManager extends Object {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoClipboardManager',
    Signals: {
      changed: {
        param_types: [TYPE_STRING],
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
    this.selectionChangedId = this.selection.connect('owner-changed', (_, selectionType: SelectionType) => {
      if (selectionType === SelectionType.SELECTION_CLIPBOARD) {
        debug('selection changed');
        this.clipboard.get_text(ClipboardType.CLIPBOARD, async (_, text: string) => {
          debug(`changed: ${text}`);
          const result = await this.getContent();
          this.emit('changed', result);
        });
      }
    });
  }

  stopTracking() {
    this.selection.disconnect(this.selectionChangedId);
  }

  private async getContent() {
    return new Promise((resolve) => {
      this.clipboard.get_text(ClipboardType.CLIPBOARD, (_, text: string) => {
        if (text) {
          if (this.clipboard.get_mimetypes(ClipboardType.CLIPBOARD).indexOf(MimeTypes.FILE) >= 0) {
            debug('we have file');
            resolve(text);
          } else {
            debug('we have text');
            resolve(text);
          }
          resolve('nothing');
        } else {
          this.clipboard.get_content(ClipboardType.CLIPBOARD, MimeTypes.IMAGE, (_, bytes: Bytes | Uint8Array) => {
            if (bytes) {
              if (bytes instanceof Bytes && bytes.get_size() > 0) {
                resolve('image byte');
                debug(`byte: ${bytes.get_size()}`);
              } else if (bytes instanceof Uint8Array && bytes.length > 0) {
                resolve('image uint');
                debug(`uint: ${bytes.length}`);
              } else {
                resolve('nothing');
              }
            } else {
              resolve('nothing');
            }
          });
        }
      });
    });
  }
}

export const clipboardManager = new ClipboardManager();

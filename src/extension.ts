import { DBus, DBusExportedObject, Settings } from '@gi-types/gio2';
import { PRIORITY_DEFAULT, Source, SOURCE_REMOVE, timeout_add } from '@gi-types/glib2';
import { Global } from '@gi-types/shell0';
import { PanoWindow } from '@pano/containers/panoWindow';
import { clipboardManager } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import {
  deleteAppDirs,
  getCurrentExtensionSettings,
  getDbPath,
  initTranslations,
  loadInterfaceXML,
  logger,
  moveDbFile,
  removeSoundContext,
  setupAppDirs,
} from '@pano/utils/shell';
import { addTopChrome, removeChrome, removeVirtualKeyboard } from '@pano/utils/ui';
import './styles/stylesheet.css';

const debug = logger('extension');
class PanoExtension {
  private panoWindow: PanoWindow;
  private keyManager: KeyManager;
  private dbus: DBusExportedObject;
  private isEnabled = false;
  private settings: Settings;
  private lastDBpath: string;
  private windowTrackerId: number | null;
  private timeoutId: number | null;

  constructor() {
    setupAppDirs();
    db.setup();
    debug('extension is initialized');
    this.keyManager = new KeyManager();
    this.panoWindow = new PanoWindow();
    const iface = loadInterfaceXML('io.elhan.Pano');
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);
    this.dbus.export(DBus.session, '/io/elhan/Pano');
    this.settings = getCurrentExtensionSettings();
    this.lastDBpath = getDbPath();
    this.settings.connect('changed::database-location', () => {
      const newDBpath = this.settings.get_string('database-location');

      if (this.isEnabled) {
        this.disable();
        moveDbFile(this.lastDBpath, newDBpath);
        db.setup();
        this.rerender();
        this.enable();
      } else {
        moveDbFile(this.lastDBpath, newDBpath);
        db.setup();
        this.rerender();
      }
      this.lastDBpath = newDBpath;
    });
  }

  enable(): void {
    this.isEnabled = true;
    setupAppDirs();
    db.start();
    addTopChrome(this.panoWindow);
    this.keyManager.listenFor('shortcut', () => this.panoWindow.toggle());
    this.keyManager.listenFor('incognito-shortcut', () => {
      this.settings.set_boolean('is-in-incognito', !this.settings.get_boolean('is-in-incognito'));
    });

    clipboardManager.startTracking();
    this.windowTrackerId = Global.get().display.connect('notify::focus-window', () => {
      const focussedWindow = Global.get().display.focus_window;
      if (focussedWindow && this.panoWindow.is_visible()) {
        this.panoWindow.hide();
      }
      const wmClass = focussedWindow?.get_wm_class();
      if (
        wmClass &&
        this.settings.get_boolean('watch-exclusion-list') &&
        this.settings.get_strv('exclusion-list').indexOf(wmClass) >= 0
      ) {
        clipboardManager.stopTracking();
      } else if (clipboardManager.isTracking === false) {
        this.timeoutId = timeout_add(PRIORITY_DEFAULT, 300, () => {
          clipboardManager.startTracking();
          if (this.timeoutId) {
            Source.remove(this.timeoutId);
          }
          this.timeoutId = null;
          return SOURCE_REMOVE;
        });
      }
    });
    debug('extension is enabled');
  }

  disable(): void {
    if (this.windowTrackerId) {
      Global.get().display.disconnect(this.windowTrackerId);
    }
    if (this.timeoutId) {
      Source.remove(this.timeoutId);
    }
    this.windowTrackerId = null;
    this.timeoutId = null;
    removeVirtualKeyboard();
    removeSoundContext();
    this.isEnabled = false;
    this.keyManager.stopListening('shortcut');
    this.keyManager.stopListening('incognito-shortcut');
    clipboardManager.stopTracking();
    removeChrome(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
  }

  async clearHistory() {
    if (this.isEnabled) {
      this.disable();
      await this.reInitialize();
      this.enable();
    } else {
      await this.reInitialize();
    }
  }

  private rerender() {
    this.panoWindow.remove_all_children();
    this.panoWindow.destroy();
    this.panoWindow = new PanoWindow();
  }

  private async reInitialize() {
    db.shutdown();
    await deleteAppDirs();
    setupAppDirs();
    db.setup();
    this.rerender();
  }
}

export default function (): PanoExtension {
  initTranslations();
  return new PanoExtension();
}

import './styles/stylesheet.css';

import { DBus, DBusExportedObject, DBusSignalFlags, Settings } from '@gi-types/gio2';
import { PRIORITY_DEFAULT, Source, SOURCE_REMOVE, timeout_add } from '@gi-types/glib2';
import { Global } from '@gi-types/shell0';
import { SettingsMenu } from '@pano/components/indicator/settingsMenu';
import { PanoWindow } from '@pano/containers/panoWindow';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import {
  debounceIds,
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
import { addTopChrome, addToStatusArea, removeChrome, removeVirtualKeyboard } from '@pano/utils/ui';

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
  private settingsMenu: SettingsMenu | null;
  private shutdownSignalId: number | null;
  private logoutSignalId: number | null;
  private rebootSignalId: number | null;
  private systemdSignalId: number | null;

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
    this.settings.connect('changed::show-indicator', () => {
      if (this.settings.get_boolean('show-indicator') && this.isEnabled) {
        this.createIndicator();
      } else {
        this.removeIndicator();
      }
    });
  }

  async clearSessionHistory() {
    if (this.settings.get_boolean('session-only-mode')) {
      debug('clearing session history');
      db.shutdown();
      clipboardManager.stopTracking();
      await deleteAppDirs();
      debug('deleted session cache and db');
      clipboardManager.setContent(
        new ClipboardContent({
          type: ContentType.TEXT,
          value: '',
        }),
      );
      debug('cleared last clipboard content');
    }
  }

  createIndicator() {
    if (this.settings.get_boolean('show-indicator')) {
      this.settingsMenu = new SettingsMenu(this.clearHistory.bind(this), () => this.panoWindow.toggle());
      addToStatusArea(this.settingsMenu);
    }
  }

  removeIndicator() {
    this.settingsMenu?.destroy();
    this.settingsMenu = null;
  }

  enable(): void {
    this.isEnabled = true;
    setupAppDirs();
    this.createIndicator();
    db.start();
    this.logoutSignalId = DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedLogout',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );

    this.rebootSignalId = DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedReboot',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );

    this.shutdownSignalId = DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedShutdown',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );
    this.systemdSignalId = DBus.system.signal_subscribe(
      null,
      'org.freedesktop.login1.Manager',
      'PrepareForShutdown',
      '/org/freedesktop/login1',
      null,
      DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );
    addTopChrome(this.panoWindow);
    this.keyManager.listenFor('global-shortcut', () => this.panoWindow.toggle());
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
    debounceIds.forEach((debounceId) => {
      Source.remove(debounceId);
    });
    this.removeIndicator();
    this.windowTrackerId = null;
    this.timeoutId = null;
    removeVirtualKeyboard();
    removeSoundContext();
    this.isEnabled = false;
    this.keyManager.stopListening('global-shortcut');
    this.keyManager.stopListening('incognito-shortcut');
    clipboardManager.stopTracking();
    removeChrome(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
    if (this.logoutSignalId) {
      DBus.session.signal_unsubscribe(this.logoutSignalId);
      this.logoutSignalId = null;
    }
    if (this.shutdownSignalId) {
      DBus.session.signal_unsubscribe(this.shutdownSignalId);
      this.shutdownSignalId = null;
    }
    if (this.rebootSignalId) {
      DBus.session.signal_unsubscribe(this.rebootSignalId);
      this.rebootSignalId = null;
    }
    if (this.systemdSignalId) {
      DBus.system.signal_unsubscribe(this.systemdSignalId);
      this.systemdSignalId = null;
    }
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

  show() {
    this.panoWindow?.show();
  }

  hide() {
    this.panoWindow?.hide();
  }

  toggle() {
    this.panoWindow?.toggle();
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

import './styles/stylesheet.css';

import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import Shell from '@girs/shell-12';
import { Extension, ExtensionMetadata } from '@gnome-shell/extensions/extension';
import { SettingsMenu } from '@pano/components/indicator/settingsMenu';
import { PanoWindow } from '@pano/containers/panoWindow';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import {
  debounceIds,
  deleteAppDirs,
  getCurrentExtensionSettings,
  getDbPath,
  loadInterfaceXML,
  logger,
  moveDbFile,
  removeSoundContext,
  setupAppDirs,
} from '@pano/utils/shell';
import { addTopChrome, addToStatusArea, removeChrome, removeVirtualKeyboard } from '@pano/utils/ui';

const debug = logger('extension');
export default class PanoExtension extends Extension {
  private keyManager: KeyManager;
  private clipboardManager: ClipboardManager;
  private panoWindow: PanoWindow;

  private dbus: Gio.DBusExportedObject;
  private isEnabled = false;
  private settings: Gio.Settings;
  private lastDBpath: string;
  private windowTrackerId: number | null;
  private timeoutId: number | null;
  private settingsMenu: SettingsMenu | null;
  private shutdownSignalId: number | null;
  private logoutSignalId: number | null;
  private rebootSignalId: number | null;
  private systemdSignalId: number | null;

  constructor(props: ExtensionMetadata) {
    super(props);
    setupAppDirs(this);
    db.setup(this);
    debug('extension is initialized');
    this.keyManager = new KeyManager(this);
    this.clipboardManager = new ClipboardManager(this);
    this.panoWindow = new PanoWindow(this, this.clipboardManager);
    const iface = loadInterfaceXML(this, 'io.elhan.Pano');
    this.dbus = Gio.DBusExportedObject.wrapJSObject(iface, this);
    this.dbus.export(Gio.DBus.session, '/io/elhan/Pano');
    this.settings = getCurrentExtensionSettings(this);
    this.lastDBpath = getDbPath(this);
    this.settings.connect('changed::database-location', () => {
      const newDBpath = this.settings.get_string('database-location');

      if (newDBpath === null) {
        //TODO better error handling
        console.error("The new DB Path is invalid (since it's null)!");
        return;
      }

      if (this.isEnabled) {
        this.disable();
        moveDbFile(this.lastDBpath, newDBpath);
        db.setup(this);
        this.rerender();
        this.enable();
      } else {
        moveDbFile(this.lastDBpath, newDBpath);
        db.setup(this);
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
      this.clipboardManager.stopTracking();
      await deleteAppDirs(this);
      debug('deleted session cache and db');
      this.clipboardManager.setContent(
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
      this.settingsMenu = new SettingsMenu(this, this.clipboardManager, this.clearHistory.bind(this), () =>
        this.panoWindow.toggle(),
      );
      addToStatusArea(this, this.settingsMenu);
    }
  }

  removeIndicator() {
    this.settingsMenu?.destroy();
    this.settingsMenu = null;
  }

  enable(): void {
    this.isEnabled = true;
    setupAppDirs(this);
    this.createIndicator();
    db.start(this);
    this.logoutSignalId = Gio.DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedLogout',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      Gio.DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );

    this.rebootSignalId = Gio.DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedReboot',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      Gio.DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );

    this.shutdownSignalId = Gio.DBus.session.signal_subscribe(
      null,
      'org.gnome.SessionManager.EndSessionDialog',
      'ConfirmedShutdown',
      '/org/gnome/SessionManager/EndSessionDialog',
      null,
      Gio.DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );
    this.systemdSignalId = Gio.DBus.system.signal_subscribe(
      null,
      'org.freedesktop.login1.Manager',
      'PrepareForShutdown',
      '/org/freedesktop/login1',
      null,
      Gio.DBusSignalFlags.NONE,
      this.clearSessionHistory.bind(this),
    );
    addTopChrome(this.panoWindow);
    this.keyManager.listenFor('global-shortcut', () => this.panoWindow.toggle());
    this.keyManager.listenFor('incognito-shortcut', () => {
      this.settings.set_boolean('is-in-incognito', !this.settings.get_boolean('is-in-incognito'));
    });

    this.clipboardManager.startTracking();
    this.windowTrackerId = Shell.Global.get().display.connect('notify::focus-window', () => {
      const focussedWindow = Shell.Global.get().display.focus_window;
      if (focussedWindow && this.panoWindow.is_visible()) {
        this.panoWindow.hide();
      }
      const wmClass = focussedWindow?.get_wm_class();
      if (
        wmClass &&
        this.settings.get_boolean('watch-exclusion-list') &&
        this.settings
          .get_strv('exclusion-list')
          .map((s) => s.toLowerCase())
          .indexOf(wmClass.toLowerCase()) >= 0
      ) {
        this.clipboardManager.stopTracking();
      } else if (this.clipboardManager.isTracking === false) {
        this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
          this.clipboardManager.startTracking();
          if (this.timeoutId) {
            GLib.Source.remove(this.timeoutId);
          }
          this.timeoutId = null;
          return GLib.SOURCE_REMOVE;
        });
      }
    });
    debug('extension is enabled');
  }

  disable(): void {
    if (this.windowTrackerId) {
      Shell.Global.get().display.disconnect(this.windowTrackerId);
    }
    if (this.timeoutId) {
      GLib.Source.remove(this.timeoutId);
    }
    debounceIds.forEach((debounceId) => {
      GLib.Source.remove(debounceId);
    });
    this.removeIndicator();
    this.windowTrackerId = null;
    this.timeoutId = null;
    removeVirtualKeyboard();
    removeSoundContext();
    this.isEnabled = false;
    this.keyManager.stopListening('global-shortcut');
    this.keyManager.stopListening('incognito-shortcut');
    this.clipboardManager.stopTracking();
    removeChrome(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
    if (this.logoutSignalId) {
      Gio.DBus.session.signal_unsubscribe(this.logoutSignalId);
      this.logoutSignalId = null;
    }
    if (this.shutdownSignalId) {
      Gio.DBus.session.signal_unsubscribe(this.shutdownSignalId);
      this.shutdownSignalId = null;
    }
    if (this.rebootSignalId) {
      Gio.DBus.session.signal_unsubscribe(this.rebootSignalId);
      this.rebootSignalId = null;
    }
    if (this.systemdSignalId) {
      Gio.DBus.system.signal_unsubscribe(this.systemdSignalId);
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
    this.panoWindow = new PanoWindow(this, this.clipboardManager);
  }

  private async reInitialize() {
    db.shutdown();
    await deleteAppDirs(this);
    setupAppDirs(this);
    db.setup(this);
    this.rerender();
  }
}

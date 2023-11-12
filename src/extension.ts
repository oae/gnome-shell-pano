import './styles/stylesheet.css';

import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import Shell from '@girs/shell-12';
import { Extension, ExtensionMetadata } from '@gnome-shell/extensions/extension';
import PanoIndicator from '@pano/components/indicator';
import { PanoWindow } from '@pano/containers/panoWindow';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import {
  debounceIds,
  deleteAppDirs,
  getCurrentExtensionSettings,
  loadInterfaceXML,
  logger,
  removeSoundContext,
  setupAppDirs,
} from '@pano/utils/shell';
import { addTopChrome, removeChrome, removeVirtualKeyboard } from '@pano/utils/ui';

const debug = logger('extension');
export default class PanoExtension extends Extension {
  private keyManager: KeyManager;
  private clipboardManager: ClipboardManager;
  private panoWindow: PanoWindow | null;
  private indicator: PanoIndicator;

  private dbus: Gio.DBusExportedObject | null;
  private settings: Gio.Settings;
  private windowTrackerId: number | null;
  private timeoutId: number | null;
  private shutdownSignalId: number | null;
  private logoutSignalId: number | null;
  private rebootSignalId: number | null;
  private systemdSignalId: number | null;
  private clipboardChangedSignalId: number | null;

  constructor(props: ExtensionMetadata) {
    super(props);
    this.settings = getCurrentExtensionSettings(this);
    setupAppDirs(this);
    db.setup(this);
    this.keyManager = new KeyManager(this);
    this.clipboardManager = new ClipboardManager(this);
    this.indicator = new PanoIndicator(this, this.clearHistory.bind(this), () => this.panoWindow?.toggle());
    debug('extension is initialized');
  }

  enable() {
    this.start();
    this.indicator.enable();
    this.enableDbus();
    debug('extension is enabled');
  }

  disable(): void {
    this.stop();
    this.disableDbus();
    this.indicator.disable();
    debug('extension is disabled');
  }

  // for dbus
  start() {
    setupAppDirs(this);
    db.setup(this);
    this.clipboardChangedSignalId = this.clipboardManager.connect('changed', () => this.indicator.animate());

    this.connectSessionDbus();
    this.panoWindow = new PanoWindow(this, this.clipboardManager);
    this.trackWindow();
    addTopChrome(this.panoWindow);
    this.keyManager.listenFor('global-shortcut', () => this.panoWindow?.toggle());
    this.keyManager.listenFor('incognito-shortcut', () => {
      this.settings.set_boolean('is-in-incognito', !this.settings.get_boolean('is-in-incognito'));
    });

    this.clipboardManager.startTracking();
  }

  // for dbus
  stop() {
    this.clipboardManager.stopTracking();
    this.keyManager.stopListening('incognito-shortcut');
    this.keyManager.stopListening('global-shortcut');
    this.untrackWindow();
    if (this.panoWindow) {
      removeChrome(this.panoWindow);
    }
    this.panoWindow?.destroy();
    this.panoWindow = null;
    db.shutdown();
    this.disconnectSessionDbus();

    if (this.clipboardChangedSignalId) {
      this.clipboardManager.disconnect(this.clipboardChangedSignalId);
      this.clipboardChangedSignalId = null;
    }

    debounceIds.forEach((debounceId) => {
      GLib.Source.remove(debounceId);
    });

    removeVirtualKeyboard();
    removeSoundContext();
  }

  // for dbus
  show() {
    this.panoWindow?.show();
  }

  // for dbus
  hide() {
    this.panoWindow?.hide();
  }

  // for dbus
  toggle() {
    this.panoWindow?.toggle();
  }

  private async clearHistory() {
    this.stop();
    await deleteAppDirs(this);
    this.start();
  }

  private async clearSessionHistory() {
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

  private enableDbus() {
    const iface = loadInterfaceXML(this, 'io.elhan.Pano');
    this.dbus = Gio.DBusExportedObject.wrapJSObject(iface, this);
    this.dbus.export(Gio.DBus.session, '/io/elhan/Pano');
  }

  private disableDbus() {
    this.dbus?.unexport();
    this.dbus = null;
  }

  private connectSessionDbus() {
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
  }

  private disconnectSessionDbus() {
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

  private trackWindow() {
    this.windowTrackerId = Shell.Global.get().display.connect('notify::focus-window', () => {
      const focussedWindow = Shell.Global.get().display.focus_window;
      if (focussedWindow && this.panoWindow?.is_visible()) {
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
  }

  private untrackWindow() {
    if (this.windowTrackerId) {
      Shell.Global.get().display.disconnect(this.windowTrackerId);
      this.windowTrackerId = null;
    }
    if (this.timeoutId) {
      GLib.Source.remove(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

import { DBus, DBusExportedObject } from '@gi-types/gio2';
import { PanoWindow } from '@pano/containers/panoWindow';
import { clipboardManager } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import { deleteAppDirs, loadInterfaceXML, logger, setupAppDirs } from '@pano/utils/shell';
import { addChrome, removeChrome } from '@pano/utils/ui';
import './styles/stylesheet.css';

const debug = logger('extension');
class PanoExtension {
  private panoWindow: PanoWindow;
  private keyManager: KeyManager;
  private dbus: DBusExportedObject;
  private isEnabled = false;

  constructor() {
    setupAppDirs();
    db.setup();
    debug('extension is initialized');
    this.keyManager = new KeyManager();
    this.panoWindow = new PanoWindow();
    const iface = loadInterfaceXML('io.elhan.Pano');
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);
    this.dbus.export(DBus.session, '/io/elhan/Pano');
  }

  enable(): void {
    this.isEnabled = true;
    setupAppDirs();
    db.start();
    addChrome(this.panoWindow);
    // TODO: read from settings
    this.keyManager.listenFor('<super><shift>v', () => this.panoWindow.toggle());
    clipboardManager.startTracking();
    debug('extension is enabled');
  }

  disable(): void {
    this.isEnabled = false;
    this.keyManager.stopListening();
    clipboardManager.stopTracking();
    removeChrome(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
  }

  clearHistory() {
    if (this.isEnabled) {
      this.disable();
      this.reInitialize();
      this.enable();
    } else {
      this.reInitialize();
    }
  }

  private reInitialize() {
    this.panoWindow.remove_all_children();
    this.panoWindow.destroy();
    db.shutdown();
    deleteAppDirs();
    setupAppDirs();
    db.setup();
    this.panoWindow = new PanoWindow();
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}

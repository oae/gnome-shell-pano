import { DBus, DBusExportedObject } from '@imports/gio2';
import { restart as restartShell } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { PanoWindow } from '@pano/containers/panoWindow';
import { db } from '@pano/utils/db';
import { clipboardManager } from '@pano/utils/clipboardManager';
import { KeyManager } from '@pano/utils/keyManager';
import { addChrome, loadInterfaceXML, logger, removeChrome, setupAppDirs } from '@pano/utils/shell';
import './styles/stylesheet.css';

const debug = logger('extension');

const global = Global.get();

class PanoExtension {
  private dbus: DBusExportedObject;
  private panoWindow: PanoWindow;
  private keyManager: KeyManager;

  constructor() {
    db.setup();
    debug('extension is initialized');
    const iface = loadInterfaceXML('io.elhan.Pano');
    this.keyManager = new KeyManager();
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);
    this.panoWindow = new PanoWindow();
    setupAppDirs();
  }

  enable(): void {
    this.dbus.export(DBus.session, '/io/elhan/Pano');
    global.stage.add_actor(this.panoWindow);
    addChrome(this.panoWindow);
    // TODO: read from settings
    this.keyManager.listenFor('<super><shift>c', () => this.panoWindow.toggle());
    clipboardManager.startTracking();

    debug('extension is enabled');
  }

  private restart(): void {
    restartShell('Restarting for Pano');
  }

  disable(): void {
    this.keyManager.stopListening();
    clipboardManager.stopTracking();
    this.dbus.unexport();
    removeChrome(this.panoWindow);
    global.stage.remove_actor(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}

import { DBus, DBusExportedObject } from '@imports/gio2';
import { restart as restartShell } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { PanoWindow } from '@pano/components/panoWindow';
import { KeyManager } from '@pano/utils/keyManager';
import { addChrome, loadInterfaceXML, logger, removeChrome } from '@pano/utils/shell';
import './styles/stylesheet.css';

const debug = logger('extension');

const global = Global.get();

class PanoExtension {
  private dbus: DBusExportedObject;
  private panoWindow: PanoWindow;
  private keyManager: KeyManager;

  constructor() {
    debug('extension is initialized');
    const iface = loadInterfaceXML('io.elhan.Pano');
    this.keyManager = new KeyManager();
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);
    this.panoWindow = new PanoWindow();
  }

  enable(): void {
    this.dbus.export(DBus.session, '/io/elhan/Pano');
    global.stage.add_actor(this.panoWindow);
    addChrome(this.panoWindow);
    // TODO: read from settings
    this.keyManager.listenFor('<super><shift>c', () => this.panoWindow.toggle());
    debug('extension is enabled');
  }

  private restart(): void {
    restartShell('Restarting for Pano');
  }

  disable(): void {
    this.keyManager.stopListening();
    this.dbus.unexport();
    global.stage.remove_actor(this.panoWindow);
    removeChrome(this.panoWindow);
    debug('extension is disabled');
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}

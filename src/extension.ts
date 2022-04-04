import { logger, loadInterfaceXML } from '@pano/utils/shell';
import { DBus, DBusExportedObject } from '@imports/gio2';
import './styles/stylesheet.css';
import { restart } from '@imports/meta10';

const debug = logger('extension');

class PanoExtension {
  private dbus: DBusExportedObject;

  constructor() {
    debug('extension is initialized');
    const iface = loadInterfaceXML('io.elhan.Pano');
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);
  }

  enable(): void {
    this.dbus.export(DBus.session, '/io/elhan/Pano');
    debug('extension is enabled');
  }

  private restart(): void {
    restart('Restarting for Pano');
  }

  disable(): void {
    this.dbus.unexport();
    debug('extension is disabled');
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}

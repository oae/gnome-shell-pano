import { logger, loadInterfaceXML } from '@pano/utils/shell';
import { DBus, DBusExportedObject } from '@imports/gio2';
import './styles/stylesheet.css';
import { restart } from '@imports/meta10';
import { BlurEffect, BlurMode, Global } from '@imports/shell0';
import { PanoWindow } from '@pano/components/panoWindow';
import { KeyManager } from '@pano/utils/keyManager';
import { AnimationMode, Color } from '@imports/clutter10';
const BLUR_BRIGHTNESS = 0.55;
const BLUR_SIGMA = 60;

const debug = logger('extension');

class PanoExtension {
  private dbus: DBusExportedObject;
  private panoWindow;
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
    this.keyManager.listenFor('<super><shift>c', () => {
      if (this.panoWindow.is_visible()) {
        this.panoWindow.ease({
          opacity: 0,
          duration: 1000,
          mode: AnimationMode.EASE_OUT_QUAD,
          onComplete: () => this.panoWindow.hide(),
        });
      } else {
        if (!this.panoWindow.get_effect('blur')) {
          this.panoWindow.add_effect(
            new BlurEffect({
              brightness: BLUR_BRIGHTNESS,
              sigma: BLUR_SIGMA,
              mode: BlurMode.ACTOR,
            }),
          );
        }
        this.panoWindow.show();
        this.panoWindow.ease({
          opacity: 200,
          duration: 1000,
          background_color: Color.from_pixel(0x000000cc),
          mode: AnimationMode.EASE_OUT_QUAD,
        });
      }
    });
    Global.get().stage.add_actor(this.panoWindow);
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

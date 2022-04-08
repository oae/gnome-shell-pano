import { Actor, AnimationMode, Color, Event, ScrollDirection } from '@imports/clutter10';
import { DBus, DBusExportedObject } from '@imports/gio2';
import { restart as restartShell } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { BoxLayout, PolicyType, ScrollView, Widget } from '@imports/st1';
import { PanoWindow } from '@pano/components/panoWindow';
import { KeyManager } from '@pano/utils/keyManager';
import { loadInterfaceXML, logger } from '@pano/utils/shell';
import './styles/stylesheet.css';

const debug = logger('extension');

const global = Global.get();
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
    this.keyManager.listenFor('<super><shift>c', () => this.panoWindow.toggle());
    global.stage.add_actor(this.panoWindow);

    const vbox = new BoxLayout({
      width: 700,
      height: 700,
      reactive: true,
      style: 'background: #ffee88;',
    });
    global.stage.add_actor(vbox);

    const scroll = new ScrollView({
      hscrollbar_policy: PolicyType.AUTOMATIC,
      vscrollbar_policy: PolicyType.NEVER,
      overlay_scrollbars: true,
      x_expand: true,
      y_expand: true,
    });
    scroll.connect('scroll-event', (_actor: Actor, event: Event) => {
      const adjustment = scroll.get_hscroll_bar().get_adjustment();
      let value = adjustment.value;
      if (
        event.get_scroll_direction() === ScrollDirection.UP ||
        event.get_scroll_direction() === ScrollDirection.LEFT
      ) {
        value -= adjustment.step_increment * 2;
      } else if (
        event.get_scroll_direction() === ScrollDirection.DOWN ||
        event.get_scroll_direction() === ScrollDirection.RIGHT
      ) {
        value += adjustment.step_increment * 2;
      }
      adjustment.remove_transition('value');
      adjustment.ease(value, {
        duration: 150,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
    });
    vbox.add_actor(scroll);

    const box = new BoxLayout({ vertical: false, x_expand: true, y_expand: true });
    scroll.add_actor(box);

    const contents = new Widget({ width: 1000, height: 500, background_color: Color.from_string('#e12')[1] });
    const contents2 = new Widget({ width: 1000, height: 500, background_color: Color.from_string('#a72')[1] });
    box.add_actor(contents);
    box.add_actor(contents2);

    debug('extension is enabled');
  }

  private restart(): void {
    restartShell('Restarting for Pano');
  }

  disable(): void {
    this.dbus.unexport();
    debug('extension is disabled');
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}

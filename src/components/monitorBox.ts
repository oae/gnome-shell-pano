import Clutter from '@girs/clutter-15';
import { MonitorConstraint } from '@girs/gnome-shell/dist/ui/layout';
import { Lightbox } from '@girs/gnome-shell/dist/ui/lightbox';
import * as main from '@girs/gnome-shell/dist/ui/main';
import GObject from '@girs/gobject-2.0';
import Shell from '@girs/shell-15';
import St from '@girs/st-15';
import { registerGObjectClass } from '@pano/utils/gjs';

interface MonitorBoxSignals {
  hide_window: Record<string, never>;
}

@registerGObjectClass
export class MonitorBox extends St.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, MonitorBoxSignals> = {
    GTypeName: 'MonitorBox',
    Signals: {
      hide_window: {},
    },
  };

  private _lightbox: Lightbox;

  constructor() {
    super({
      name: 'PanoMonitorBox',
      visible: false,
      reactive: true,
      x: 0,
      y: 0,
    });

    this.connect('button-press-event', () => {
      this.emit('hide_window');
      return Clutter.EVENT_STOP;
    });

    const constraint = new Clutter.BindConstraint({
      source: Shell.Global.get().stage,
      coordinate: Clutter.BindCoordinate.ALL,
    });
    this.add_constraint(constraint);

    const backgroundStack = new St.Widget({
      layoutManager: new Clutter.BinLayout(),
      xExpand: true,
      yExpand: true,
    });
    const _backgroundBin = new St.Bin({ child: backgroundStack });
    const _monitorConstraint = new MonitorConstraint({});
    _backgroundBin.add_constraint(_monitorConstraint);
    this.add_child(_backgroundBin);
    this._lightbox = new Lightbox(this, {
      inhibitEvents: true,
      radialEffect: false,
    });
    this._lightbox.highlight(_backgroundBin);
    this._lightbox.styleClass = 'pano-monitor-box';

    const _eventBlocker = new Clutter.Actor({ reactive: true });
    backgroundStack.add_child(_eventBlocker);
    main.layoutManager.uiGroup.add_child(this);
  }

  open() {
    this._lightbox.lightOn();
    this.show();
  }

  close() {
    this._lightbox.lightOff();
    this.hide();
  }

  override vfunc_touch_event(event: Clutter.Event): boolean {
    if (event.type() === Clutter.EventType.TOUCH_END) {
      this.emit('hide_window');
      return Clutter.EVENT_STOP;
    }
    return Clutter.EVENT_PROPAGATE;
  }

  override destroy(): void {
    super.destroy();
  }
}

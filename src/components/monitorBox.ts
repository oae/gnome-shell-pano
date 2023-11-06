import Clutter from '@girs/clutter-12';
import GObject from '@girs/gobject-2.0';
import Shell from '@girs/shell-12';
import St1 from '@girs/st-12';
import * as layout from '@gnome-shell/ui/layout';
import * as lightbox from '@gnome-shell/ui/lightbox';
import * as main from '@gnome-shell/ui/main';
import { registerGObjectClass } from '@pano/utils/gjs';

interface MonitorBoxSignals {
  hide: Record<string, never>;
}

@registerGObjectClass
export class MonitorBox extends St1.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, MonitorBoxSignals> = {
    GTypeName: 'MonitorBox',
    Signals: {
      hide_window: {},
    },
  };

  private _lightbox: lightbox.Lightbox;

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

    const backgroundStack = new St1.Widget({
      layout_manager: new Clutter.BinLayout(),
      x_expand: true,
      y_expand: true,
    });
    const _backgroundBin = new St1.Bin({ child: backgroundStack });
    const _monitorConstraint = new layout.MonitorConstraint({});
    _backgroundBin.add_constraint(_monitorConstraint);
    this.add_actor(_backgroundBin);
    this._lightbox = new lightbox.Lightbox(this, {
      inhibitEvents: true,
      radialEffect: false,
    });
    this._lightbox.highlight(_backgroundBin);
    this._lightbox.set({ style_class: 'pano-monitor-box' });

    const _eventBlocker = new Clutter.Actor({ reactive: true });
    backgroundStack.add_actor(_eventBlocker);
    main.uiGroup.add_actor(this);
  }

  open() {
    this._lightbox.lightOn();
    this.show();
  }

  close() {
    this._lightbox.lightOff();
    this.hide();
  }

  override destroy(): void {
    super.destroy();
  }
}

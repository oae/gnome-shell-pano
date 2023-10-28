import Clutter from '@gi-types/clutter10';
import { MetaInfo } from '@gi-types/gobject2';
import Shell from '@gi-types/shell0';
import St1 from '@gi-types/st1';
import * as layout from '@gnome-shell/ui/layout';
import * as lightbox from '@gnome-shell/ui/lightbox';
import * as main from '@gnome-shell/ui/main';
import { registerGObjectClass } from '@pano/utils/gjs';
@registerGObjectClass
export class MonitorBox extends St1.BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'MonitorBox',
    Signals: {
      hide: {},
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
      this.emit('hide');
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

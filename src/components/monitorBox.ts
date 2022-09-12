import { Actor, BindConstraint, BindCoordinate, BinLayout, EVENT_STOP } from '@gi-types/clutter10';
import { MetaInfo } from '@gi-types/gobject2';
import { Global } from '@gi-types/shell0';
import { Bin, BoxLayout, Widget } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';

const { Lightbox } = imports.ui.lightbox;
@registerGObjectClass
export class MonitorBox extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'MonitorBox',
    Signals: {
      hide: {},
    },
  };

  private _lightbox: any;

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
      return EVENT_STOP;
    });

    const constraint = new BindConstraint({
      source: Global.get().stage,
      coordinate: BindCoordinate.ALL,
    });
    this.add_constraint(constraint);

    const backgroundStack = new Widget({
      layout_manager: new BinLayout(),
      x_expand: true,
      y_expand: true,
    });
    const _backgroundBin = new Bin({ child: backgroundStack });
    const _monitorConstraint = new imports.ui.layout.MonitorConstraint();
    _backgroundBin.add_constraint(_monitorConstraint);
    this.add_actor(_backgroundBin);
    this._lightbox = new Lightbox(this, {
      inhibitEvents: true,
      radialEffect: false,
    });
    this._lightbox.highlight(_backgroundBin);
    this._lightbox.set({ style_class: 'pano-monitor-box' });

    const _eventBlocker = new Actor({ reactive: true });
    backgroundStack.add_actor(_eventBlocker);
    imports.ui.main.uiGroup.add_actor(this);
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

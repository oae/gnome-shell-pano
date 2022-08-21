import { ActorAlign, EVENT_STOP } from '@gi-types/clutter10';
import { MetaInfo } from '@gi-types/gobject2';
import { MonitorManager } from '@gi-types/meta10';
import { BoxLayout } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { addChrome, getMonitorConstraintForIndex, getMonitors, removeChrome } from '@pano/utils/shell';

const monitorManager = MonitorManager.get();

@registerGObjectClass
export class MonitorBox extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'MonitorBox',
    Signals: {
      hide: {},
    },
  };
  private monitorChangedEventId: number;

  constructor() {
    super({
      name: 'PanoMonitorBox',
      visible: false,
      vertical: true,
      reactive: true,
      opacity: 0,
    });

    this.connect('button-press-event', () => {
      this.emit('hide');
      return EVENT_STOP;
    });

    this.monitorChangedEventId = monitorManager.connect('monitors-changed', this.updateMonitorBox.bind(this));
    this.updateMonitorBox();

    addChrome(this);
  }

  private updateMonitorBox(): void {
    this.remove_all_children();
    getMonitors().forEach((_, index) => {
      const box = new BoxLayout({
        constraints: getMonitorConstraintForIndex(index),
        x_align: ActorAlign.FILL,
        y_align: ActorAlign.FILL,
        visible: true,
        vertical: true,
        reactive: true,
        opacity: 0,
      });
      this.add_child(box);
    });
  }

  override destroy(): void {
    monitorManager.disconnect(this.monitorChangedEventId);
    removeChrome(this);
    super.destroy();
  }
}

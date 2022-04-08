import {
  Actor,
  ActorAlign,
  AnimationMode,
  BindConstraint,
  BindCoordinate,
  EVENT_PROPAGATE,
  KeyEvent,
  KEY_Escape,
} from '@imports/clutter10';
import { registerClass } from '@imports/gobject2';
import { BoxLayout, PolicyType, ScrollView, Widget } from '@imports/st1';
import { getMonitorIndexForPointer, logger } from '@pano/utils/shell';
import { PanoItem } from './panoItem';

const debug = logger('pano-window');

export const PanoWindow = registerClass(
  {},
  class PanoWindow extends BoxLayout {
    private panoItems: any[];
    private scrollView: ScrollView;
    private list;

    constructor() {
      super({
        name: 'pano-window',
        constraints: new imports.ui.layout.MonitorConstraint({
          index: getMonitorIndexForPointer(),
        }),
        style_class: 'pano-window',
        x_align: ActorAlign.FILL,
        y_align: ActorAlign.END,
        visible: false,
        reactive: true,
        height: 300,
        opacity: 0,
      });
    }

    override show() {
      this.clear_constraints();
      this.add_constraint(
        new imports.ui.layout.MonitorConstraint({
          index: getMonitorIndexForPointer(),
        }),
      );

      this.add_actor(this.scrollView);
      super.show();
      this.ease({
        opacity: 255,
        duration: 250,
        mode: AnimationMode.EASE_OUT_QUAD,
      });
      this.grab_key_focus();
      debug('showing pano');
    }

    override hide() {
      this.ease({
        opacity: 0,
        duration: 200,
        mode: AnimationMode.EASE_OUT_QUAD,
        onComplete: () => {
          super.hide();

          this.remove_actor(this.scrollView);
        },
      });
      debug('hiding pano');
    }

    // override vfunc_key_focus_out(): void {
    //   this.hide();
    // }

    override vfunc_key_press_event(event: KeyEvent): boolean {
      if (event.keyval === KEY_Escape) {
        this.hide();
      }

      return EVENT_PROPAGATE;
    }

    toggle(): void {
      this.is_visible() ? this.hide() : this.show();
    }
  },
);

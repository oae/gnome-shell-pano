import { Actor, ActorAlign, AnimationMode, Color, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@imports/clutter10';
import { registerClass } from '@imports/gobject2';
import { getMonitorIndexForPointer, logger } from '@pano/utils/shell';

const debug = logger('pano-window');

export const PanoWindow = registerClass(
  {},
  class PanoWindow extends Actor {
    private switcher;

    constructor() {
      super({
        name: 'pano-window',
        constraints: new imports.ui.layout.MonitorConstraint({
          index: getMonitorIndexForPointer(),
        }),
        x_align: ActorAlign.FILL,
        y_align: ActorAlign.END,
        visible: false,
        reactive: true,
        background_color: Color.from_pixel(0x000000cc),
        height: 300,
        opacity: 0,
      });
      // this.switcher = new PanoItem();
    }

    override show() {
      this.clear_constraints();
      this.add_constraint(
        new imports.ui.layout.MonitorConstraint({
          index: getMonitorIndexForPointer(),
        }),
      );
      super.show();
      this.ease({
        opacity: 255,
        duration: 250,
        background_color: Color.from_pixel(0x000000cc),
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
        onComplete: () => super.hide(),
      });
      debug('hiding pano');
    }

    override vfunc_key_focus_out(): void {
      this.hide();
    }

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

import { ActorAlign, AnimationMode, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@imports/clutter10';
import { BoxLayout } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getMonitorIndexForPointer, logger } from '@pano/utils/shell';
import { PanoItem } from './panoItem';
import { PanoScrollView } from './panoScrollView';

const debug = logger('pano-window');

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;

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
      opacity: 0,
      can_focus: true,
    });
    this.scrollView = new PanoScrollView();
    this.add_actor(this.scrollView);
  }

  override show() {
    this.clear_constraints();
    this.add_constraint(
      new imports.ui.layout.MonitorConstraint({
        index: getMonitorIndexForPointer(),
      }),
    );
    this.scrollView.addItem(new PanoItem());
    this.scrollView.addItem(new PanoItem());
    this.scrollView.addItem(new PanoItem());
    this.scrollView.addItem(new PanoItem());
    super.show();
    this.grab_key_focus();
    this.ease({
      opacity: 255,
      duration: 250,
      mode: AnimationMode.EASE_OUT_QUAD,
    });
    debug('showing pano');
  }

  override hide() {
    this.ease({
      opacity: 0,
      duration: 200,
      mode: AnimationMode.EASE_OUT_QUAD,
      onComplete: () => {
        super.hide();
      },
    });
    debug('hiding pano');
  }

  override vfunc_key_focus_out(): void {
    // this.hide();
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
}

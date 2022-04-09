import { Actor, AnimationMode, EVENT_STOP, ScrollDirection, ScrollEvent } from '@imports/clutter10';
import { BoxLayout, PolicyType, ScrollView } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class PanoScrollView extends ScrollView {
  private list: BoxLayout;

  constructor() {
    super({
      hscrollbar_policy: PolicyType.EXTERNAL,
      vscrollbar_policy: PolicyType.NEVER,
      overlay_scrollbars: true,
      x_expand: true,
      y_expand: true,
    });
    this.list = new BoxLayout({ vertical: false, x_expand: true, y_expand: true });
    this.add_actor(this.list);
  }

  addItem(item: Actor) {
    this.list.add_child(item);
  }

  override vfunc_scroll_event(event: ScrollEvent): boolean {
    const adjustment = this.hscroll.adjustment;
    let value = adjustment.value;
    if (event.direction === ScrollDirection.UP || event.direction === ScrollDirection.LEFT) {
      value -= adjustment.step_increment * 2;
    } else if (event.direction === ScrollDirection.DOWN || event.direction === ScrollDirection.RIGHT) {
      value += adjustment.step_increment * 2;
    }
    adjustment.remove_transition('value');
    adjustment.ease(value, {
      duration: 150,
      mode: AnimationMode.EASE_OUT_QUAD,
    });

    return EVENT_STOP;
  }
}

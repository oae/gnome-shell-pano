import {
  AnimationMode,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  KEY_Left,
  KEY_Right,
  ScrollDirection,
  ScrollEvent,
} from '@imports/clutter10';
import { Stage } from '@imports/meta10';
import { Global } from '@imports/shell0';
import { BoxLayout, PolicyType, ScrollView } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { PanoWindow } from '@pano/containers/panoWindow';
import { db } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

const global = Global.get();

@registerGObjectClass
export class PanoScrollView extends ScrollView {
  private list: BoxLayout;
  private items: PanoItem[];
  private lastFocus: PanoItem;
  private parent: PanoWindow;

  constructor(parent: PanoWindow) {
    super({
      hscrollbar_policy: PolicyType.EXTERNAL,
      vscrollbar_policy: PolicyType.NEVER,
      overlay_scrollbars: true,
      x_expand: true,
      y_expand: true,
    });
    this.list = new BoxLayout({ vertical: false, x_expand: true, y_expand: true });
    this.add_actor(this.list);
    this.items = [];
    this.parent = parent;
  }

  canGiveFocus(): boolean {
    const visibleItems = this.items.filter((item) => item.is_visible());
    return this.lastFocus && visibleItems.length > 0 && this.lastFocus === visibleItems[0];
  }

  scrollToItem(item: PanoItem, shouldFocus = true) {
    if (!item) {
      return;
    }

    const box = item.get_allocation_box();

    const adjustment = this.hscroll.adjustment;

    const value = box.x1 + adjustment.step_increment / 2.0 - adjustment.page_size / 2.0;
    adjustment.ease(value, {
      duration: 150,
      mode: AnimationMode.EASE_OUT_QUAD,
    });

    const focus = (global.stage as Stage).key_focus;
    if (shouldFocus && this.parent.is_visible() && focus && this.parent.contains(focus)) {
      item.grab_key_focus();
    }
  }

  getItem(id: number): PanoItem | undefined {
    return this.items.find((i) => i.dbId === id);
  }

  addItem(item: PanoItem) {
    this.list.insert_child_at_index(item, 0);
    this.items.unshift(item);
    item.connect('activated', () => {
      this.moveItemToStart(item);
      this.parent.hide();
    });
  }

  moveItemToStart(item: PanoItem) {
    this.list.remove_child(item);
    this.list.insert_child_at_index(item, 0);
    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
    this.items.unshift(item);
    this.lastFocus = item;
    this.scrollToItem(this.lastFocus);
  }

  focus() {
    const hasItems = this.items.length > 0;
    if (!hasItems) {
      return;
    }

    const visibleItems = this.items.filter((item) => item.is_visible());
    if (!visibleItems) {
      return;
    }

    if (this.lastFocus && this.lastFocus.is_visible()) {
      this.scrollToItem(this.lastFocus);
      return;
    } else {
      this.focusFirst(true);
    }
  }

  onSearch(keyword: string) {
    if (!keyword) {
      this.items.forEach((i) => i.show());
      this.focusFirst(false);
      return;
    }

    const result = db.search(keyword);

    this.items.forEach((item) => (item.dbId !== null && result.indexOf(item.dbId) >= 0 ? item.show() : item.hide()));
    this.focusFirst(false);
  }

  private focusFirst(shouldGrabFocus: boolean) {
    const visibleItems = this.items.filter((i) => i.is_visible());
    if (visibleItems.length > 0) {
      this.lastFocus = visibleItems[0];
      this.scrollToItem(this.lastFocus, shouldGrabFocus);
    }
  }

  private focusNext() {
    const focus = (global.stage as Stage).get_key_focus() as PanoItem;
    const visibleItems = this.items.filter((i) => i.is_visible());
    const currentIndex = visibleItems.indexOf(focus);
    if (currentIndex >= 0 && currentIndex < visibleItems.length - 1) {
      this.lastFocus = visibleItems[currentIndex + 1];
      this.scrollToItem(this.lastFocus);
    }
  }

  private focusPrevious() {
    const focus = (global.stage as Stage).get_key_focus() as PanoItem;
    const visibleItems = this.items.filter((i) => i.is_visible());
    const currentIndex = visibleItems.indexOf(focus);
    if (currentIndex > 0) {
      this.lastFocus = visibleItems[currentIndex - 1];
      this.scrollToItem(this.lastFocus);
    }
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Right) {
      this.focusNext();
    } else if (event.keyval === KEY_Left) {
      this.focusPrevious();
    }

    return EVENT_PROPAGATE;
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

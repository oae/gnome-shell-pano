import {
  AnimationMode,
  Event,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  keysym_to_unicode,
  KEY_BackSpace,
  KEY_Left,
  KEY_Right,
  KEY_Up,
  ScrollDirection,
  ScrollEvent,
} from '@gi-types/clutter10';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { Stage } from '@gi-types/meta10';
import { Global } from '@gi-types/shell0';
import { BoxLayout, PolicyType, ScrollView } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { PanoWindow } from '@pano/containers/panoWindow';
import { ClipboardQueryBuilder, db } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

const global = Global.get();

@registerGObjectClass
export class PanoScrollView extends ScrollView {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoScrollView',
    Signals: {
      'scroll-focus-out': {},
      'scroll-backspace-press': {},
      'scroll-key-press': {
        param_types: [TYPE_STRING],
        accumulator: 0,
      },
    },
  };

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

    this.connect('key-press-event', (_: ScrollView, event: Event) => {
      if (event.get_state()) {
        return EVENT_PROPAGATE;
      }

      if ((event.get_key_symbol() === KEY_Left && this.canGiveFocus()) || event.get_key_symbol() === KEY_Up) {
        this.emit('scroll-focus-out');
        return EVENT_STOP;
      }

      if (event.get_key_symbol() == KEY_BackSpace) {
        this.emit('scroll-backspace-press');
        return EVENT_STOP;
      }
      const unicode = keysym_to_unicode(event.get_key_symbol());
      if (unicode === 0) {
        return EVENT_PROPAGATE;
      }

      this.emit('scroll-key-press', String.fromCharCode(unicode));

      return EVENT_STOP;
    });
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

    if (!Number.isFinite(value)) {
      return;
    }

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
    return this.items.find((i) => i.dbItem.id === id);
  }

  addItem(item: PanoItem) {
    this.list.insert_child_at_index(item, 0);
    this.items.unshift(item);
    item.connect('activated', () => {
      this.moveItemToStart(item);
      this.parent.hide();
    });
  }

  replaceOrAddItem(newItem: PanoItem, oldItem?: PanoItem) {
    if (oldItem) {
      const index = this.items.indexOf(oldItem);
      this.items.splice(index, 1);
      this.list.remove_child(oldItem);
    }

    this.addItem(newItem);
  }

  removeItem(dbId: number) {
    const item = this.getItem(dbId);
    if (!item) {
      return;
    }
    const index = this.items.indexOf(item);
    if (this.lastFocus === item) {
      this.focusNext();
    } else {
      this.focusFirst(true);
    }
    item.hide();
    this.items.splice(index, 1);
    this.list.remove_child(item);
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

    const result = db
      .query(new ClipboardQueryBuilder().withContainingSearchValue(keyword).build())
      .map((dbItem) => dbItem.id);

    this.items.forEach((item) =>
      item.dbItem.id !== null && result.indexOf(item.dbItem.id) >= 0 ? item.show() : item.hide(),
    );
    this.focusFirst(false);
  }

  selectFirstItem() {
    const visibleItems = this.items.filter((i) => i.is_visible());
    if (visibleItems.length > 0) {
      const item = visibleItems[0];
      this.moveItemToStart(item);
      item.emit('activated');
    }
  }

  focusFirst(shouldGrabFocus: boolean) {
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

    if (event.direction === ScrollDirection.SMOOTH) {
      return EVENT_STOP;
    }

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

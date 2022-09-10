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
import { Settings } from '@gi-types/gio2';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { BoxLayout, PolicyType, ScrollView } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager } from '@pano/utils/clipboardManager';
import { ClipboardQueryBuilder, db } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { createPanoItem, createPanoItemFromDb, removeItemResources } from '@pano/utils/panoItemFactory';
import { getCurrentExtensionSettings } from '@pano/utils/shell';

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
  private settings: Settings;
  private currentFocus: PanoItem | null = null;
  private currentFilter: string;

  constructor() {
    super({
      hscrollbar_policy: PolicyType.EXTERNAL,
      vscrollbar_policy: PolicyType.NEVER,
      overlay_scrollbars: true,
      x_expand: true,
      y_expand: true,
    });
    this.settings = getCurrentExtensionSettings();

    this.list = new BoxLayout({ vertical: false, x_expand: true, y_expand: true });
    this.add_actor(this.list);

    this.connect('key-press-event', (_: ScrollView, event: Event) => {
      if (event.get_state()) {
        return EVENT_PROPAGATE;
      }

      if (
        (event.get_key_symbol() === KEY_Left &&
          this.getVisibleItems().findIndex((item) => item.dbItem.id === this.currentFocus?.dbItem.id) === 0) ||
        event.get_key_symbol() === KEY_Up
      ) {
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

    db.query(new ClipboardQueryBuilder().withLimit(-1, this.settings.get_int('history-length')).build()).forEach(
      (dbItem) => {
        removeItemResources(dbItem);
      },
    );

    db.query(new ClipboardQueryBuilder().withLimit(this.settings.get_int('history-length'), 0).build()).forEach(
      (dbItem) => {
        const panoItem = createPanoItemFromDb(dbItem);
        if (panoItem) {
          this.appendItem(panoItem);
        }
      },
    );

    this.settings.connect('changed::history-length', () => {
      this.removeExcessiveItems();
    });

    clipboardManager.connect('changed', async (_: any, content: ClipboardContent) => {
      const panoItem = await createPanoItem(content);
      if (panoItem) {
        this.prependItem(panoItem);
      }
    });
  }

  private appendItem(panoItem: PanoItem) {
    this.connectOnRemove(panoItem);

    this.list.add_child(panoItem);
  }

  private prependItem(panoItem: PanoItem) {
    const existingItem = this.getItem(panoItem);

    if (existingItem) {
      this.removeItem(existingItem);
    }

    this.connectOnRemove(panoItem);

    this.list.insert_child_at_index(panoItem, 0);
    this.removeExcessiveItems();
  }

  private connectOnRemove(panoItem: PanoItem) {
    panoItem.connect('on-remove', () => {
      if (this.currentFocus === panoItem) {
        this.focusNext() || this.focusPrev();
      }
      this.removeItem(panoItem);
      this.filter(this.currentFilter);
      if (this.getVisibleItems().length === 0) {
        this.emit('scroll-focus-out');
      } else {
        this.focusOnClosest();
      }
    });
  }

  private removeItem(item: PanoItem) {
    item.hide();
    this.list.remove_child(item);
  }

  private getItem(panoItem: PanoItem): PanoItem | undefined {
    return this.getItems().find((item) => (item as PanoItem).dbItem.id === panoItem.dbItem.id) as PanoItem;
  }

  private getItems(): PanoItem[] {
    return this.list.get_children() as PanoItem[];
  }

  private getVisibleItems(): PanoItem[] {
    return this.list.get_children().filter((item) => item.is_visible()) as PanoItem[];
  }

  private removeExcessiveItems() {
    const historyLength = this.settings.get_int('history-length');
    if (historyLength < this.getItems().length) {
      this.getItems()
        .slice(historyLength)
        .forEach((item) => {
          this.removeItem(item);
        });
    }
    db.query(new ClipboardQueryBuilder().withLimit(-1, this.settings.get_int('history-length')).build()).forEach(
      (dbItem) => {
        removeItemResources(dbItem);
      },
    );
  }

  private focusNext() {
    const lastFocus = this.currentFocus;
    if (!lastFocus) {
      return this.focusOnClosest();
    }

    const index = this.getVisibleItems().findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
    if (index + 1 < this.getVisibleItems().length) {
      this.currentFocus = this.getVisibleItems()[index + 1];
      this.currentFocus.grab_key_focus();
      return true;
    }

    return false;
  }

  private focusPrev() {
    const lastFocus = this.currentFocus;
    if (!lastFocus) {
      return this.focusOnClosest();
    }

    const index = this.getVisibleItems().findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
    if (index - 1 >= 0) {
      this.currentFocus = this.getVisibleItems()[index - 1];
      this.currentFocus.grab_key_focus();
      return true;
    }

    return false;
  }

  filter(text: string) {
    this.currentFilter = text;
    if (!text) {
      this.getItems().forEach((i) => i.show());
      return;
    }

    const result = db
      .query(
        new ClipboardQueryBuilder()
          .withContainingSearchValue(text)
          .withLimit(this.settings.get_int('history-length'), 0)
          .build(),
      )
      .map((dbItem) => dbItem.id);

    this.getItems().forEach((item) => (result.indexOf(item.dbItem.id) >= 0 ? item.show() : item.hide()));
  }

  focusOnClosest() {
    const lastFocus = this.currentFocus;
    if (lastFocus !== null) {
      if (lastFocus.get_parent() === this.list && lastFocus.is_visible()) {
        lastFocus.grab_key_focus();
        return true;
      } else {
        let nextFocus = this.getVisibleItems().find((item) => item.dbItem.copyDate <= lastFocus.dbItem.copyDate);
        if (!nextFocus) {
          nextFocus = this.getVisibleItems()
            .reverse()
            .find((item) => item.dbItem.copyDate >= lastFocus.dbItem.copyDate);
        }
        if (nextFocus) {
          this.currentFocus = nextFocus;
          nextFocus.grab_key_focus();
          return true;
        }
      }
    } else if (this.getVisibleItems().length > 0) {
      this.currentFocus = this.getVisibleItems()[0];
      this.currentFocus.grab_key_focus();
      return true;
    }

    return false;
  }

  scrollToFirstItem() {
    if (this.getVisibleItems().length === 0) {
      return;
    }

    this.scrollToItem(this.getVisibleItems()[0]);
  }

  scrollToFocussedItem() {
    if (!this.currentFocus || !this.currentFocus.is_visible()) {
      return;
    }

    this.scrollToItem(this.currentFocus);
  }

  beforeHide() {
    this.currentFocus = null;
    this.scrollToFirstItem();
    this.emit('scroll-focus-out');
  }

  private scrollToItem(item: PanoItem) {
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
  }

  selectFirstItem() {
    const visibleItems = this.getVisibleItems();
    if (visibleItems.length > 0) {
      const item = visibleItems[0];
      item.emit('activated');
    }
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Right) {
      this.focusNext();
      this.scrollToFocussedItem();
    } else if (event.keyval === KEY_Left) {
      this.focusPrev();
      this.scrollToFocussedItem();
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

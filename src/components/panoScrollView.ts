import {
  AnimationMode,
  Event,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  keysym_to_unicode,
  KEY_Alt_L,
  KEY_Alt_R,
  KEY_BackSpace,
  KEY_ISO_Left_Tab,
  KEY_KP_Tab,
  KEY_Left,
  KEY_Right,
  KEY_Tab,
  KEY_Up,
  ScrollDirection,
  ScrollEvent,
} from '@gi-types/clutter10';
import { Settings } from '@gi-types/gio2';
import { MetaInfo, TYPE_BOOLEAN, TYPE_STRING } from '@gi-types/gobject2';
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
      'scroll-update-list': {},
      'scroll-alt-press': {},
      'scroll-tab-press': {
        param_types: [TYPE_BOOLEAN],
        accumulator: 0,
      },
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
  private currentItemTypeFilter: string;
  private showFavorites: boolean;

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
      if (
        event.get_key_symbol() === KEY_Tab ||
        event.get_key_symbol() === KEY_ISO_Left_Tab ||
        event.get_key_symbol() === KEY_KP_Tab
      ) {
        this.emit('scroll-tab-press', event.has_shift_modifier());
        return EVENT_STOP;
      }
      if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
        this.selectItemByIndex(event.get_key_symbol() - 49);
        return EVENT_STOP;
      }

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
      if (event.get_key_symbol() === KEY_Alt_L || event.get_key_symbol() === KEY_Alt_R) {
        this.emit('scroll-alt-press');
        return EVENT_PROPAGATE;
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

    db.query(new ClipboardQueryBuilder().build()).forEach((dbItem) => {
      const panoItem = createPanoItemFromDb(dbItem);
      if (panoItem) {
        this.connectOnRemove(panoItem);
        this.connectOnFavorite(panoItem);
        this.list.add_child(panoItem);
      }
    });

    const firstItem = this.list.get_first_child() as PanoItem;
    if (firstItem) {
      firstItem.emit('activated');
    }

    this.settings.connect('changed::history-length', () => {
      this.removeExcessiveItems();
    });

    clipboardManager.connect('changed', async (_: any, content: ClipboardContent) => {
      const panoItem = await createPanoItem(content);
      if (panoItem) {
        this.prependItem(panoItem);
        this.filter(this.currentFilter, this.currentItemTypeFilter, this.showFavorites);
      }
    });
  }

  private prependItem(panoItem: PanoItem) {
    const existingItem = this.getItem(panoItem);

    if (existingItem) {
      this.removeItem(existingItem);
    }

    this.connectOnRemove(panoItem);
    this.connectOnFavorite(panoItem);

    this.list.insert_child_at_index(panoItem, 0);
    this.removeExcessiveItems();
  }

  private connectOnFavorite(panoItem: PanoItem) {
    panoItem.connect('on-favorite', () => {
      this.emit('scroll-update-list');
    });
  }

  private connectOnRemove(panoItem: PanoItem) {
    panoItem.connect('on-remove', () => {
      if (this.currentFocus === panoItem) {
        this.focusNext() || this.focusPrev();
      }
      this.removeItem(panoItem);
      this.filter(this.currentFilter, this.currentItemTypeFilter, this.showFavorites);
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
    const items = this.getItems().filter((i) => i.dbItem.isFavorite === false);
    if (historyLength < items.length) {
      items.slice(historyLength).forEach((item) => {
        this.removeItem(item);
      });
    }
    db.query(
      new ClipboardQueryBuilder().withFavorites(false).withLimit(-1, this.settings.get_int('history-length')).build(),
    ).forEach((dbItem) => {
      removeItemResources(dbItem);
    });
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

  filter(text: string, itemType: string, showFavorites: boolean) {
    this.currentFilter = text;
    this.currentItemTypeFilter = itemType;
    this.showFavorites = showFavorites;
    if (!text && !itemType && null === showFavorites) {
      this.getItems().forEach((i) => i.show());
      return;
    }

    const builder = new ClipboardQueryBuilder();

    if (showFavorites) {
      builder.withFavorites(showFavorites);
    }

    if (itemType) {
      builder.withItemTypes([itemType]);
    }

    if (text) {
      builder.withContainingSearchValue(text);
    }

    const result = db.query(builder.build()).map((dbItem) => dbItem.id);

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
    } else if (this.currentFilter && this.getVisibleItems().length > 0) {
      this.currentFocus = this.getVisibleItems()[0];
      this.currentFocus.grab_key_focus();
      return true;
    } else if (!this.currentFilter && this.getVisibleItems().length > 1) {
      this.currentFocus = this.getVisibleItems()[1];
      this.currentFocus.grab_key_focus();
      return true;
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

  focusAndScrollToFirst() {
    if (this.getVisibleItems().length === 0) {
      this.emit('scroll-focus-out');
      this.currentFocus = null;
      return;
    }

    this.currentFocus = this.getVisibleItems()[0];
    this.currentFocus.grab_key_focus();
    this.hscroll.adjustment.set_value(this.get_allocation_box().x1);
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

  selectItemByIndex(index: number) {
    const visibleItems = this.getVisibleItems();
    if (visibleItems.length > index) {
      const item = visibleItems[index];
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

import '@girs/gnome-shell/dist/extensions/global';

import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import GObject from '@girs/gobject-2.0';
import Shell from '@girs/shell-14';
import St from '@girs/st-14';
import { LoadingPanoItem } from '@pano/components/loadingPanoItem';
import { PanoItem } from '@pano/components/panoItem';
import { SearchBox } from '@pano/components/searchBox';
import type PanoExtension from '@pano/extension';
import { ClipboardContent, ClipboardManager } from '@pano/utils/clipboardManager';
import { getScrollViewAdjustment, scrollViewAddChild } from '@pano/utils/compatibility';
import { ClipboardQueryBuilder, db, ItemType } from '@pano/utils/db';
import { registerGObjectClass, SignalRepresentationType, SignalsDefinition } from '@pano/utils/gjs';
import { createPanoItem, createPanoItemFromDb, removeItemResources } from '@pano/utils/panoItemFactory';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { isVertical } from '@pano/utils/ui';

export type PanoScrollViewSignalType =
  | 'scroll-focus-out'
  | 'scroll-update-list'
  | 'scroll-alt-press'
  | 'scroll-tab-press'
  | 'scroll-backspace-press'
  | 'scroll-key-press';

interface PanoScrollViewSignals extends SignalsDefinition<PanoScrollViewSignalType> {
  'scroll-focus-out': Record<string, never>;
  'scroll-update-list': Record<string, never>;
  'scroll-alt-press': Record<string, never>;
  'scroll-tab-press': SignalRepresentationType<[GObject.GType<boolean>]>;
  'scroll-backspace-press': Record<string, never>;
  'scroll-key-press': SignalRepresentationType<[GObject.GType<string>]>;
}

//TODO: the list member of St.BoxLayout are of type Clutter.Actor and we have to cast constantly from PanoItem to Clutter.Actor and reverse, fix that somehow

type Child = PanoItem | LoadingPanoItem;

@registerGObjectClass
export class PanoScrollView extends St.ScrollView {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, PanoScrollViewSignals> = {
    GTypeName: 'PanoScrollView',
    Signals: {
      'scroll-focus-out': {},
      'scroll-update-list': {},
      'scroll-alt-press': {},
      'scroll-tab-press': {
        param_types: [GObject.TYPE_BOOLEAN],
        accumulator: 0,
      },
      'scroll-backspace-press': {},
      'scroll-key-press': {
        param_types: [GObject.TYPE_STRING],
        accumulator: 0,
      },
    },
  };

  private list: St.BoxLayout;
  private settings: Gio.Settings;
  private currentFocus: Child | null = null;
  private currentFilter: string | null = null;
  private currentItemTypeFilter: ItemType | null = null;
  private showFavorites: boolean | null = null;
  private searchBox: SearchBox;
  private ext: ExtensionBase;
  private clipboardChangedSignalId: number | null = null;
  private clipboardManager: ClipboardManager;

  constructor(ext: PanoExtension, clipboardManager: ClipboardManager, searchBox: SearchBox) {
    super({
      overlayScrollbars: true,
      xExpand: true,
      yExpand: true,
    });
    this.ext = ext;
    this.clipboardManager = clipboardManager;
    this.searchBox = searchBox;
    this.settings = getCurrentExtensionSettings(this.ext);

    this.setScrollbarPolicy();

    this.list = new St.BoxLayout({
      vertical: isVertical(this.settings.get_uint('window-position')),
      xExpand: true,
      yExpand: true,
    });

    this.settings.connect('changed::window-position', () => {
      this.setScrollbarPolicy();
      this.list.set_vertical(isVertical(this.settings.get_uint('window-position')));
    });
    scrollViewAddChild(this, this.list);

    const shouldFocusOut = (symbol: number) => {
      const isPanoVertical = isVertical(this.settings.get_uint('window-position'));
      const currentItemIndex = this.getVisibleItems().findIndex(
        (item) => item.dbItem.id === this.currentFocus?.dbItem.id,
      );

      if (isPanoVertical) {
        return (symbol === Clutter.KEY_Up && currentItemIndex === 0) || symbol === Clutter.KEY_Left;
      } else {
        return (symbol === Clutter.KEY_Left && currentItemIndex === 0) || symbol === Clutter.KEY_Up;
      }
    };

    this.connect('key-press-event', (_: St.ScrollView, event: Clutter.Event) => {
      if (
        event.get_key_symbol() === Clutter.KEY_Tab ||
        event.get_key_symbol() === Clutter.KEY_ISO_Left_Tab ||
        event.get_key_symbol() === Clutter.KEY_KP_Tab
      ) {
        this.emit('scroll-tab-press', event.has_shift_modifier());
        return Clutter.EVENT_STOP;
      }
      if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
        this.selectItemByIndex(event.get_key_symbol() - 49);
        return Clutter.EVENT_STOP;
      }

      if (event.get_state()) {
        return Clutter.EVENT_PROPAGATE;
      }

      if (shouldFocusOut(event.get_key_symbol())) {
        this.emit('scroll-focus-out');
        return Clutter.EVENT_STOP;
      }
      if (event.get_key_symbol() === Clutter.KEY_Alt_L || event.get_key_symbol() === Clutter.KEY_Alt_R) {
        this.emit('scroll-alt-press');
        return Clutter.EVENT_PROPAGATE;
      }

      if (event.get_key_symbol() === Clutter.KEY_BackSpace) {
        this.emit('scroll-backspace-press');
        return Clutter.EVENT_STOP;
      }
      const unicode = Clutter.keysym_to_unicode(event.get_key_symbol());
      if (unicode === 0) {
        return Clutter.EVENT_PROPAGATE;
      }

      this.emit('scroll-key-press', String.fromCharCode(unicode));

      return Clutter.EVENT_STOP;
    });

    const items = db.query(new ClipboardQueryBuilder().build());

    for (let index = 0; index < items.length; ++index) {
      const dbItem = items[index]!;
      const panoItem = new LoadingPanoItem(dbItem);

      this.list.add_child(panoItem);

      //TODO: this doesn't work atm, fix it!
      void createPanoItemFromDb(ext, this.clipboardManager, dbItem).then((newItem) => {
        if (newItem) {
          panoItem.connect('motion-event', () => {
            if (this.isHovering(this.searchBox)) {
              this.searchBox.focus();
            }
          });
          this.connectOnRemove(newItem);
          this.connectOnFavorite(newItem);
          this.list.set_child_at_index(newItem, index);
        }
      });
    }

    const firstItem = this.list.get_first_child() as Child | null;
    if (firstItem !== null) {
      firstItem.emit('activated');
    }

    this.settings.connect('changed::history-length', () => {
      this.removeExcessiveItems();
    });

    this.clipboardChangedSignalId = this.clipboardManager.connect(
      'changed',
      async (_: any, content: ClipboardContent) => {
        const panoItem = await createPanoItem(ext, this.clipboardManager, content);
        if (panoItem && this) {
          this.prependItem(panoItem);
          this.filter(this.currentFilter, this.currentItemTypeFilter, this.showFavorites);
        }
      },
    );
  }

  private setScrollbarPolicy() {
    if (isVertical(this.settings.get_uint('window-position'))) {
      this.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);
    } else {
      this.set_policy(St.PolicyType.EXTERNAL, St.PolicyType.NEVER);
    }
  }

  private prependItem(panoItem: PanoItem) {
    const existingItem = this.getItem(panoItem);

    if (existingItem) {
      this.removeItem(existingItem);
    }

    this.connectOnRemove(panoItem);
    this.connectOnFavorite(panoItem);

    panoItem.connect('motion-event', () => {
      if (this.isHovering(this.searchBox)) {
        this.searchBox.focus();
      }
    });

    this.list.insert_child_at_index(panoItem, 0);
    this.removeExcessiveItems();
  }

  private isHovering(actor: Clutter.Actor) {
    const [x, y] = Shell.Global.get().get_pointer();
    const [x1, y1] = [actor.get_abs_allocation_vertices()[0]!.x, actor.get_abs_allocation_vertices()[0]!.y];
    const [x2, y2] = [actor.get_abs_allocation_vertices()[3]!.x, actor.get_abs_allocation_vertices()[3]!.y];

    return x1 <= x && x <= x2 && y1 <= y && y <= y2;
  }

  private connectOnFavorite(panoItem: PanoItem) {
    panoItem.connect('on-favorite', () => {
      this.currentFocus = panoItem;
      this.focusOnClosest();
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

  private removeItem(item: Child) {
    item.hide();
    this.list.remove_child(item);
  }

  private getItem(panoItem: Child): Child | undefined {
    return this.getItems().find((item) => item.dbItem.id === panoItem.dbItem.id);
  }

  private getItems(): Child[] {
    return this.list.get_children() as Child[];
  }

  private getVisibleItems(): Child[] {
    return this.getItems().filter((item) => item.is_visible());
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
      removeItemResources(this.ext, dbItem);
    });
  }

  private focusNext() {
    const lastFocus = this.currentFocus;
    if (!lastFocus) {
      return this.focusOnClosest();
    }

    const items = this.getVisibleItems();

    const index = items.findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
    if (index + 1 < items.length) {
      this.currentFocus = items[index + 1]!;
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

    const items = this.getVisibleItems();

    const index = items.findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
    if (index - 1 >= 0) {
      this.currentFocus = items[index - 1]!;
      this.currentFocus.grab_key_focus();
      return true;
    }

    return false;
  }

  filter(text: string | null, itemType: ItemType | null, showFavorites: boolean | null) {
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
    const items = this.getVisibleItems();

    if (lastFocus !== null) {
      if (lastFocus.get_parent() === this.list && lastFocus.is_visible()) {
        lastFocus.grab_key_focus();
        return true;
      } else {
        let nextFocus = items.find((item) => item.dbItem.copyDate <= lastFocus.dbItem.copyDate);
        if (!nextFocus) {
          nextFocus = items.reverse().find((item) => item.dbItem.copyDate >= lastFocus.dbItem.copyDate);
        }
        if (nextFocus) {
          this.currentFocus = nextFocus;
          nextFocus.grab_key_focus();
          return true;
        }
      }
    } else if (this.currentFilter && items.length > 0) {
      this.currentFocus = items[0]!;
      this.currentFocus.grab_key_focus();
      return true;
    } else if (!this.currentFilter && items.length > 1) {
      this.currentFocus = items[1]!;
      this.currentFocus.grab_key_focus();
      return true;
    } else if (items.length > 0) {
      this.currentFocus = items[0]!;
      this.currentFocus.grab_key_focus();
      return true;
    }

    return false;
  }

  scrollToFirstItem() {
    const items = this.getVisibleItems();
    if (items.length === 0) {
      return;
    }

    this.scrollToItem(items[0]!);
  }

  scrollToFocussedItem() {
    if (!this.currentFocus || !this.currentFocus.is_visible()) {
      return;
    }

    this.scrollToItem(this.currentFocus);
  }

  focusAndScrollToFirst() {
    const items = this.getVisibleItems();

    if (items.length === 0) {
      this.emit('scroll-focus-out');
      this.currentFocus = null;
      return;
    }

    this.currentFocus = items[0]!;
    this.currentFocus.grab_key_focus();
    if (isVertical(this.settings.get_uint('window-position'))) {
      this.vscroll.adjustment.set_value(this.get_allocation_box().y1);
    } else {
      this.hscroll.adjustment.set_value(this.get_allocation_box().x1);
    }
  }

  beforeHide() {
    this.currentFocus = null;
    this.scrollToFirstItem();
    this.emit('scroll-focus-out');
  }

  private scrollToItem(item: Child) {
    const box = item.get_allocation_box();

    let adjustment: St.Adjustment | undefined;

    let value: number | undefined;
    if (isVertical(this.settings.get_uint('window-position'))) {
      adjustment = getScrollViewAdjustment(this, 'v');
      value = box.y1 + adjustment.stepIncrement / 2.0 - adjustment.pageSize / 2.0;
    } else {
      adjustment = getScrollViewAdjustment(this, 'h');
      value = box.x1 + adjustment.stepIncrement / 2.0 - adjustment.pageSize / 2.0;
    }

    if (!Number.isFinite(value)) {
      return;
    }

    adjustment.ease(value, {
      duration: 150,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });
  }

  selectFirstItem() {
    const visibleItems = this.getVisibleItems();
    if (visibleItems.length > 0) {
      const item = visibleItems[0]!;
      item.emit('activated');
    }
  }

  selectItemByIndex(index: number) {
    const visibleItems = this.getVisibleItems();
    if (visibleItems.length > index) {
      const item = visibleItems[index]!;
      item.emit('activated');
    }
  }

  override vfunc_key_press_event(event: Clutter.Event): boolean {
    const isPanoVertical = isVertical(this.settings.get_uint('window-position'));
    if (isPanoVertical && event.get_key_symbol() === Clutter.KEY_Up) {
      this.focusPrev();
      this.scrollToFocussedItem();
    } else if (isPanoVertical && event.get_key_symbol() === Clutter.KEY_Down) {
      this.focusNext();
      this.scrollToFocussedItem();
    } else if (!isPanoVertical && event.get_key_symbol() === Clutter.KEY_Left) {
      this.focusPrev();
      this.scrollToFocussedItem();
    } else if (!isPanoVertical && event.get_key_symbol() === Clutter.KEY_Right) {
      this.focusNext();
      this.scrollToFocussedItem();
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_scroll_event(event: Clutter.Event): boolean {
    let adjustment: St.Adjustment | undefined;

    if (isVertical(this.settings.get_uint('window-position'))) {
      adjustment = this.vscroll.adjustment;
    } else {
      adjustment = this.hscroll.adjustment;
    }
    let value = adjustment.value;

    if (event.get_scroll_direction() === Clutter.ScrollDirection.SMOOTH) {
      return Clutter.EVENT_STOP;
    }

    if (
      event.get_scroll_direction() === Clutter.ScrollDirection.UP ||
      event.get_scroll_direction() === Clutter.ScrollDirection.LEFT
    ) {
      value -= adjustment.stepIncrement * 2;
    } else if (
      event.get_scroll_direction() === Clutter.ScrollDirection.DOWN ||
      event.get_scroll_direction() === Clutter.ScrollDirection.RIGHT
    ) {
      value += adjustment.stepIncrement * 2;
    }

    adjustment.remove_transition('value');

    adjustment.ease(value, {
      duration: 150,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });

    return Clutter.EVENT_STOP;
  }

  override destroy(): void {
    if (this.clipboardChangedSignalId) {
      this.clipboardManager.disconnect(this.clipboardChangedSignalId);
      this.clipboardChangedSignalId = null;
    }
    this.getItems().forEach((item) => {
      item.destroy();
    });

    super.destroy();
  }
}

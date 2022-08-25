import { AnimationMode, EVENT_STOP, ScrollDirection, ScrollEvent } from '@gi-types/clutter10';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { BoxLayout, PolicyType, ScrollView } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItem } from '@pano/components/panoItem';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { ClipboardQueryBuilder, db } from '@pano/utils/db';
import { createPanoItem, createPanoItemFromDb } from '@pano/utils/panoItemFactory';
import { ClipboardContent, clipboardManager } from '@pano/utils/clipboardManager';
import { Settings } from '@gi-types/gio2';

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
  private currentFocus: number | null = null;

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
      this.fillRemainingItems();
    });

    clipboardManager.connect('changed', async (_: any, content: ClipboardContent) => {
      const panoItem = await createPanoItem(content);
      if (panoItem) {
        this.prependItem(panoItem);
      }
    });
  }

  private appendItem(panoItem: PanoItem) {
    panoItem.connect('on-remove', () => {
      this.removeItem(panoItem);
      this.fillRemainingItems();
    });

    this.list.add_child(panoItem);
  }

  private prependItem(panoItem: PanoItem) {
    const existingItem = this.getItem(panoItem);

    if (existingItem) {
      this.removeItem(existingItem);
    }

    panoItem.connect('on-remove', () => {
      this.removeItem(panoItem);
      this.fillRemainingItems();
    });

    this.list.insert_child_at_index(panoItem, 0);
    this.removeExcessiveItems();
  }

  private removeItem(item: PanoItem) {
    item.hide();
    this.list.remove_child(item);
  }

  private getItem(panoItem: PanoItem): PanoItem | undefined {
    return this.getItems().find((item) => (item as PanoItem).dbItem.id === panoItem.dbItem.id) as PanoItem;
  }

  private isFull() {
    return this.settings.get_int('history-length') === this.getItems().length;
  }

  private getItems(): PanoItem[] {
    return this.list.get_children() as PanoItem[];
  }

  private removeExcessiveItems() {
    const historyLength = this.settings.get_int('history-length');
    if (historyLength < this.getItems().length) {
      this.getItems()
        .slice(historyLength)
        .forEach((item) => this.removeItem(item));
    }
  }

  private fillRemainingItems() {
    if (this.isFull()) {
      return;
    }

    const limit = Math.max(this.settings.get_int('history-length') - this.getItems().length, 0);
    const offset = this.getItems().length;

    db.query(new ClipboardQueryBuilder().withLimit(limit, offset).build()).forEach((dbItem) => {
      const panoItem = createPanoItemFromDb(dbItem);
      if (panoItem) {
        this.appendItem(panoItem);
      }
    });
  }

  filter(text: string) {
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

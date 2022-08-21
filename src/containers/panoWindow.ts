import { ActorAlign, AnimationMode, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { BoxLayout } from '@imports/st1';
import { MonitorBox } from '@pano/components/monitorBox';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { SearchBox } from '@pano/components/searchBox';
import { ClipboardContent, clipboardManager } from '@pano/utils/clipboardManager';
import { ClipboardQueryBuilder, db, DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { createPanoItem, createPanoItemFromDb } from '@pano/utils/panoItemFactory';
import { getCachePath, getImagesPath, getMonitorConstraint, logger } from '@pano/utils/shell';

const debug = logger('pano-window');

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private searchBox: SearchBox;
  private monitorBox: MonitorBox;

  constructor() {
    super({
      name: 'pano-window',
      constraints: getMonitorConstraint(),
      style_class: 'pano-window',
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.END,
      visible: false,
      vertical: true,
      reactive: true,
      opacity: 0,
      can_focus: true,
    });

    this.monitorBox = new MonitorBox();
    this.scrollView = new PanoScrollView(this);
    this.searchBox = new SearchBox();

    this.setupMonitorBox();
    this.setupScrollView();
    this.setupSearchBox();

    this.add_actor(this.searchBox);
    this.add_actor(this.scrollView);

    const dbItems = db.query(new ClipboardQueryBuilder().build());

    dbItems.forEach((dbItem: DBItem) => {
      const item = createPanoItemFromDb(dbItem);
      if (item) {
        item.connect('on-remove', (_, dbItemStr: string) => {
          this.removeItem(dbItemStr);
        });

        this.scrollView.addItem(item);
      }
    });

    clipboardManager.connect('changed', async (_: any, content: ClipboardContent) => this.updateHistory(content));
  }

  private removeItem(dbItemStr: string) {
    const dbItem: DBItem = JSON.parse(dbItemStr);
    db.delete(dbItem.id);
    if (dbItem.itemType === 'LINK') {
      const { image } = JSON.parse(dbItem.metaData || '{}');
      if (image && File.new_for_uri(`file://${getCachePath()}/${image}.png`).query_exists(null)) {
        File.new_for_uri(`file://${getCachePath()}/${image}.png`).delete(null);
      }
    } else if (dbItem.itemType === 'IMAGE') {
      const imageFilePath = `file://${getImagesPath()}/${dbItem.content}.png`;
      const imageFile = File.new_for_uri(imageFilePath);
      if (imageFile.query_exists(null)) {
        imageFile.delete(null);
      }
    }

    this.scrollView.removeItem(dbItem.id);
  }

  private setupMonitorBox() {
    this.monitorBox.connect('hide', () => this.hide());
  }

  private setupSearchBox() {
    this.searchBox.connect('search-focus-out', () => this.scrollView.focus());
    this.searchBox.connect('search-submit', () => this.scrollView.selectFirstItem());
    this.searchBox.connect('search-text-changed', (_: any, text: string) => {
      this.scrollView.onSearch(text);
    });
  }

  private setupScrollView() {
    this.scrollView.connect('scroll-focus-out', () => {
      this.searchBox.focus();
    });

    this.scrollView.connect('scroll-backspace-press', () => {
      this.searchBox.removeChar();
      this.searchBox.focus();
    });

    this.scrollView.connect('scroll-key-press', (_: any, text: string) => {
      this.searchBox.focus();
      this.searchBox.appendText(text);
    });
  }

  private async updateHistory(content: ClipboardContent) {
    try {
      const panoItem = await createPanoItem(content);

      if (panoItem !== null) {
        const existingItem = this.scrollView.getItem(panoItem.dbItem.id);

        panoItem.connect('on-remove', (_, dbItemStr: string) => {
          this.removeItem(dbItemStr);
        });

        this.scrollView.replaceOrAddItem(panoItem, existingItem);

        if (this.searchBox.getText()) {
          this.scrollView.onSearch(this.searchBox.getText());
        }
      }
    } catch (err) {
      debug(`err: ${err}`);
    }
  }

  toggle(): void {
    this.is_visible() ? this.hide() : this.show();
  }

  override show() {
    this.clear_constraints();
    this.add_constraint(getMonitorConstraint());
    super.show();
    this.searchBox.selectAll();
    this.searchBox.focus();
    this.ease({
      opacity: 255,
      duration: 250,
      mode: AnimationMode.EASE_OUT_QUAD,
    });
    this.monitorBox.show();
    debug('showing pano');
  }

  override hide() {
    this.monitorBox.hide();
    this.ease({
      opacity: 0,
      duration: 200,
      mode: AnimationMode.EASE_OUT_QUAD,
      onComplete: () => {
        super.hide();
        this.scrollView.focusFirst(false);
      },
    });
    debug('hiding pano');
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Escape) {
      this.hide();
    }

    return EVENT_PROPAGATE;
  }

  override destroy(): void {
    this.monitorBox.destroy();
    this.searchBox.destroy();
    super.destroy();
  }
}

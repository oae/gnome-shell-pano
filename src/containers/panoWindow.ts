import {
  ActorAlign,
  AnimationMode,
  Event,
  EVENT_PROPAGATE,
  EVENT_STOP,
  KeyEvent,
  keysym_to_unicode,
  KEY_Down,
  KEY_Escape,
  KEY_Left,
  KEY_Right,
  KEY_Up,
} from '@imports/clutter10';
import { MonitorManager } from '@imports/meta10';
import { BoxLayout, Entry, Icon, ScrollView } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { ClipboardContent, clipboardManager } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { createPanoItem, createPanoItemFromDb } from '@pano/utils/panoItemFactory';
import {
  addChrome,
  getMonitorConstraint,
  getMonitorConstraintForIndex,
  getMonitors,
  logger,
  removeChrome,
} from '@pano/utils/shell';

const debug = logger('pano-window');
const monitorManager = MonitorManager.get();

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private search: Entry;
  private monitorBox: BoxLayout;
  private monitorChangedEventId: number;

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

    this.monitorBox = new BoxLayout({
      name: 'PanoMonitorBox',
      visible: false,
      vertical: true,
      reactive: true,
      opacity: 0,
    });
    this.monitorBox.connect('button-press-event', () => {
      this.hide();
      return EVENT_STOP;
    });

    this.monitorChangedEventId = monitorManager.connect('monitors-changed', this.updateMonitorBox.bind(this));
    this.updateMonitorBox();

    addChrome(this.monitorBox);

    this.scrollView = new PanoScrollView(this);
    const searchBox = new BoxLayout({
      x_align: ActorAlign.CENTER,
      style_class: 'search-entry-container',
      vertical: false,
    });
    this.search = new Entry({
      can_focus: true,
      hint_text: 'Type to search',
      track_hover: true,
      width: 300,
      primary_icon: new Icon({
        style_class: 'search-entry-icon',
        icon_name: 'edit-find-symbolic',
      }),
    });
    this.search.clutter_text.connect('key-press-event', (_: Entry, event: Event) => {
      if (
        event.get_key_symbol() === KEY_Down ||
        (event.get_key_symbol() === KEY_Right &&
          (this.search.clutter_text.cursor_position === -1 || this.search.text.length === 0))
      ) {
        this.scrollView.focus();
      }
    });
    this.scrollView.connect('key-press-event', (_: ScrollView, event: Event) => {
      if (event.get_state()) {
        return EVENT_PROPAGATE;
      }

      if (event.get_key_symbol() === KEY_Left && this.scrollView.canGiveFocus()) {
        this.search.grab_key_focus();
        return EVENT_STOP;
      }

      if (event.get_key_symbol() === KEY_Up) {
        this.search.grab_key_focus();
        return EVENT_STOP;
      }
      const unicode = keysym_to_unicode(event.get_key_symbol());
      if (unicode === 0) {
        return EVENT_PROPAGATE;
      }

      this.search.grab_key_focus();
      this.search.text += String.fromCharCode(unicode);

      return EVENT_STOP;
    });
    searchBox.add_child(this.search);
    this.add_actor(searchBox);
    this.add_actor(this.scrollView);

    const dbItems = db.query();

    dbItems.forEach(({ id, itemType, content, copyDate }) => {
      const item = createPanoItemFromDb(id, itemType, content, copyDate);
      if (item) {
        this.scrollView.addItem(item);
      }
    });

    clipboardManager.connect('changed', this.onNewItem.bind(this));
  }

  private onNewItem(_: any, content: ClipboardContent) {
    createPanoItem(
      content,
      (item: PanoItem) => {
        if (item) {
          this.scrollView.addItem(item);
        }
      },
      (id: number) => {
        const item = this.scrollView.getItem(id);
        if (item) {
          this.scrollView.moveItemToStart(item);
          // TODO: update timestamp in db
        }
      },
    );
  }

  private updateMonitorBox(): void {
    this.monitorBox.remove_all_children();
    getMonitors().forEach((_, index) => {
      const box = new BoxLayout({
        constraints: getMonitorConstraintForIndex(index),
        x_align: ActorAlign.FILL,
        y_align: ActorAlign.FILL,
        visible: true,
        vertical: true,
        reactive: true,
        opacity: 0,
      });
      this.monitorBox.add_child(box);
    });
  }

  toggle(): void {
    this.is_visible() ? this.hide() : this.show();
  }

  override show() {
    this.clear_constraints();
    this.add_constraint(getMonitorConstraint());
    super.show();
    this.search.grab_key_focus();
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
    monitorManager.disconnect(this.monitorChangedEventId);
    removeChrome(this.monitorBox);
    this.monitorBox.destroy();
    super.destroy();
  }
}

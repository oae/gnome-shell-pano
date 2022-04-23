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
  KEY_Right,
  KEY_Up,
} from '@imports/clutter10';
import { BoxLayout, Entry, Icon, ScrollView } from '@imports/st1';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { ClipboardContent, clipboardManager } from '@pano/utils/clipboardManager';
import { registerGObjectClass } from '@pano/utils/gjs';
import { createPanoItem } from '@pano/utils/panoItemFactory';
import { getMonitorConstraint, logger } from '@pano/utils/shell';

const debug = logger('pano-window');

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private search: Entry;

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
    this.scrollView = new PanoScrollView();
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
        (event.get_key_symbol() === KEY_Right && this.search.clutter_text.cursor_position === -1)
      ) {
        this.scrollView.focus();
      }
    });
    this.scrollView.connect('key-press-event', (_: ScrollView, event: Event) => {
      if (event.get_state()) {
        return EVENT_PROPAGATE;
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

    clipboardManager.connect('changed', this.onNewItem.bind(this));
  }

  private onNewItem(_: any, content: ClipboardContent) {
    const item = createPanoItem(content);
    if (item) {
      this.scrollView.addItem(item);
    }
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

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Escape) {
      this.hide();
    }

    return EVENT_PROPAGATE;
  }
}

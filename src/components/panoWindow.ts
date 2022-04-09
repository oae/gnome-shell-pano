import { ActorAlign, AnimationMode, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@imports/clutter10';
import { BoxLayout, Entry, Icon } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getMonitorIndexForPointer, logger } from '@pano/utils/shell';
import { PanoItem } from './panoItem';
import { PanoScrollView } from './panoScrollView';

const debug = logger('pano-window');

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private search: Entry;

  constructor() {
    super({
      name: 'pano-window',
      constraints: new imports.ui.layout.MonitorConstraint({
        index: getMonitorIndexForPointer(),
      }),
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
    searchBox.add_child(this.search);
    this.add_actor(searchBox);
    this.add_actor(this.scrollView);
  }

  override show() {
    this.scrollView.addItem(new PanoItem(PanoItemTypes.FILE, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.IMAGE, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.TEXT, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.LINK, new Date()));
    this.clear_constraints();
    this.add_constraint(
      new imports.ui.layout.MonitorConstraint({
        index: getMonitorIndexForPointer(),
      }),
    );
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

  override vfunc_key_focus_out(): void {
    // this.hide();
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Escape) {
      this.hide();
    }

    return EVENT_PROPAGATE;
  }

  toggle(): void {
    this.is_visible() ? this.hide() : this.show();
  }
}

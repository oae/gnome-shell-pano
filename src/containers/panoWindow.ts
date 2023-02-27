import { ActorAlign, AnimationMode, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@gi-types/clutter10';
import { Settings } from '@gi-types/gio2';
import { BoxLayout } from '@gi-types/st1';
import { MonitorBox } from '@pano/components/monitorBox';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { SearchBox } from '@pano/components/searchBox';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getMonitorConstraint } from '@pano/utils/ui';

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private searchBox: SearchBox;
  private monitorBox: MonitorBox;
  private settings: Settings;

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

    this.settings = getCurrentExtensionSettings();
    this.set_height(this.settings.get_int('window-height'));
    this.settings.connect('changed::window-height', () => {
      this.set_height(this.settings.get_int('window-height'));
    });
    this.monitorBox = new MonitorBox();
    this.scrollView = new PanoScrollView();
    this.searchBox = new SearchBox();

    this.setupMonitorBox();
    this.setupScrollView();
    this.setupSearchBox();

    this.add_actor(this.searchBox);
    this.add_actor(this.scrollView);

    this.settings.connect('changed::is-in-incognito', () => {
      if (this.settings.get_boolean('is-in-incognito')) {
        this.add_style_class_name('incognito');
      } else {
        this.remove_style_class_name('incognito');
      }
    });

    if (this.settings.get_boolean('is-in-incognito')) {
      this.add_style_class_name('incognito');
    }
  }

  private setupMonitorBox() {
    this.monitorBox.connect('hide', () => this.hide());
  }

  private setupSearchBox() {
    this.searchBox.connect('search-focus-out', () => {
      this.scrollView.focusOnClosest();
      this.scrollView.scrollToFocussedItem();
    });
    this.searchBox.connect('search-submit', () => {
      this.scrollView.selectFirstItem();
    });
    this.searchBox.connect('search-text-changed', (_: any, text: string) => {
      this.scrollView.filter(text);
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

  toggle(): void {
    this.is_visible() ? this.hide() : this.show();
  }

  override show() {
    this.clear_constraints();
    this.add_constraint(getMonitorConstraint());
    super.show();
    if (this.settings.get_boolean('keep-search-entry')) {
      this.searchBox.selectAll();
    } else {
      this.searchBox.clear();
    }
    this.searchBox.focus();
    this.ease({
      opacity: 255,
      duration: 250,
      mode: AnimationMode.EASE_OUT_QUAD,
    });
    this.monitorBox.open();

    return EVENT_PROPAGATE;
  }

  override hide() {
    this.monitorBox.close();
    this.ease({
      opacity: 0,
      duration: 200,
      mode: AnimationMode.EASE_OUT_QUAD,
      onComplete: () => {
        if (!this.settings.get_boolean('keep-search-entry')) {
          this.searchBox.clear();
        }
        this.scrollView.beforeHide();
        super.hide();
      },
    });

    return EVENT_PROPAGATE;
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

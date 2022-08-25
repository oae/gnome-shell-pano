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
    this.monitorBox = new MonitorBox();
    this.scrollView = new PanoScrollView();
    this.searchBox = new SearchBox();

    this.setupMonitorBox();
    this.setupScrollView();
    this.setupSearchBox();

    this.add_actor(this.searchBox);
    this.add_actor(this.scrollView);
  }

  private setupMonitorBox() {
    this.monitorBox.connect('hide', () => this.hide());
  }

  private setupSearchBox() {
    this.searchBox.connect('search-focus-out', () => {
      log('search-focus');
    });
    this.searchBox.connect('search-submit', () => {
      log('search-submit');
    });
    this.searchBox.connect('search-text-changed', (_: any, text: string) => {
      log(text);
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
    this.searchBox.selectAll();
    this.searchBox.focus();
    this.ease({
      opacity: 255,
      duration: 250,
      mode: AnimationMode.EASE_OUT_QUAD,
    });
    this.monitorBox.show();
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

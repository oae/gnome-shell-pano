import '@girs/gnome-shell/dist/extensions/global';

import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Shell from '@girs/shell-16';
import St from '@girs/st-16';
import { MonitorBox } from '@pano/components/monitorBox';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { SearchBox } from '@pano/components/searchBox';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { ItemType } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { orientationCompatibility } from '@pano/utils/shell_compatibility';
import { getAlignment, getMonitorConstraint, isVertical } from '@pano/utils/ui';

@registerGObjectClass
export class PanoWindow extends St.BoxLayout {
  private scrollView: PanoScrollView;
  private searchBox: SearchBox;
  private monitorBox: MonitorBox;
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager) {
    super({
      name: 'pano-window',
      constraints: getMonitorConstraint(),
      styleClass: 'pano-window',
      visible: false,
      ...orientationCompatibility(true),
      reactive: true,
      opacity: 0,
      canFocus: true,
    });

    this.settings = getCurrentExtensionSettings(ext);
    this.setAlignment();

    const themeContext = St.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    this.setWindowDimensions(themeContext.scaleFactor);
    themeContext.connect('notify::scale-factor', () => this.setWindowDimensions(themeContext.scaleFactor));
    this.settings.connect('changed::item-width', () => this.setWindowDimensions(themeContext.scaleFactor));
    this.settings.connect('changed::item-height', () => this.setWindowDimensions(themeContext.scaleFactor));
    this.settings.connect('changed::enable-headers', () => this.setWindowDimensions(themeContext.scaleFactor));
    this.settings.connect('changed::compact-mode', () => this.setWindowDimensions(themeContext.scaleFactor));
    this.settings.connect('changed::window-position', () => {
      this.setWindowDimensions(themeContext.scaleFactor);
      this.setAlignment();
    });
    this.settings.connect('changed::window-floating', this.setStyle.bind(this));
    this.settings.connect('changed::window-margin-left', this.setStyle.bind(this));
    this.settings.connect('changed::window-margin-right', this.setStyle.bind(this));
    this.settings.connect('changed::window-margin-top', this.setStyle.bind(this));
    this.settings.connect('changed::window-margin-bottom', this.setStyle.bind(this));

    this.settings.connect('changed::window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::incognito-window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::is-in-incognito', this.setStyle.bind(this));

    this.setStyle();

    this.monitorBox = new MonitorBox();
    this.searchBox = new SearchBox(ext);
    this.scrollView = new PanoScrollView(ext, clipboardManager, this.searchBox);

    // Add incognito mode icon
    this.searchBox.set_style(`background-image: url(file:///${ext.path}/images/incognito-mode.svg);`);

    this.setupMonitorBox();
    this.setupScrollView();
    this.setupSearchBox();

    this.add_child(this.searchBox);
    this.add_child(this.scrollView);
  }

  private setWindowDimensions(scaleFactor: number) {
    this.remove_style_class_name('vertical');
    if (isVertical(this.settings.get_uint('window-position'))) {
      this.add_style_class_name('vertical');
      this.set_width((this.settings.get_int('item-width') + 32) * scaleFactor);
    } else {
      const mult = this.settings.get_boolean('compact-mode') ? 0.5 : 1;
      const header = this.settings.get_boolean('enable-headers') ? 48 : 0;
      this.set_height((Math.floor(this.settings.get_int('item-height') * mult) + 76 + header) * scaleFactor);
    }
  }

  private setAlignment() {
    const [x_align, y_align] = getAlignment(this.settings.get_uint('window-position'));
    this.set_x_align(x_align);
    this.set_y_align(y_align);
  }

  private setStyle() {
    let backgroundColor;
    if (this.settings.get_boolean('is-in-incognito')) {
      this.add_style_class_name('incognito');
      backgroundColor = this.settings.get_string('incognito-window-background-color');
    } else {
      this.remove_style_class_name('incognito');
      backgroundColor = this.settings.get_string('window-background-color');
    }

    let margins;
    if (this.settings.get_boolean('window-floating')) {
      this.add_style_class_name('floating');

      const left = this.settings.get_int('window-margin-left');
      const right = this.settings.get_int('window-margin-right');
      const top = this.settings.get_int('window-margin-top');
      const bottom = this.settings.get_int('window-margin-bottom');

      margins = `${top}px ${right}px ${bottom}px ${left}px`;
    } else {
      this.remove_style_class_name('floating');
      margins = '0px';
    }

    this.set_style(`background-color: ${backgroundColor}; margin: ${margins}`);
  }

  private setupMonitorBox() {
    this.monitorBox.connect('hide_window', () => this.hide());
  }

  private setupSearchBox() {
    this.searchBox.connect('search-focus-out', () => {
      this.scrollView.focusOnClosest();
      this.scrollView.scrollToFocussedItem();
    });
    this.searchBox.connect('search-submit', () => {
      this.scrollView.selectFirstItem();
    });
    this.searchBox.connect(
      'search-text-changed',
      (_: any, text: string, itemType: ItemType, showFavorites: boolean) => {
        this.scrollView.filter(text, itemType, showFavorites);
      },
    );
    this.searchBox.connect('search-item-select-shortcut', (_: any, index: number) => {
      this.scrollView.selectItemByIndex(index);
    });
  }

  private setupScrollView() {
    this.scrollView.connect('scroll-update-list', () => {
      this.searchBox.focus();
      this.searchBox.emitSearchTextChange();
      this.scrollView.focusOnClosest();
      this.scrollView.scrollToFocussedItem();
    });
    this.scrollView.connect('scroll-focus-out', () => {
      this.searchBox.focus();
    });

    this.scrollView.connect('scroll-backspace-press', () => {
      this.searchBox.removeChar();
      this.searchBox.focus();
    });

    this.scrollView.connect('scroll-alt-press', () => {
      this.searchBox.focus();
      this.searchBox.toggleFavorites();
      this.scrollView.focusAndScrollToFirst();
    });

    this.scrollView.connect('scroll-tab-press', (_: any, hasShift: boolean) => {
      this.searchBox.focus();
      this.searchBox.toggleItemType(hasShift);
      this.scrollView.focusAndScrollToFirst();
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
    this.setAlignment();
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
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });
    this.monitorBox.open();

    return Clutter.EVENT_PROPAGATE;
  }

  override hide() {
    this.monitorBox.close();
    this.ease({
      opacity: 0,
      duration: 200,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
      onComplete: () => {
        if (!this.settings.get_boolean('keep-search-entry')) {
          this.searchBox.clear();
        }
        this.scrollView.beforeHide();
        super.hide();
      },
    });

    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_key_press_event(event: Clutter.Event): boolean {
    if (event.get_key_symbol() === Clutter.KEY_Escape) {
      this.hide();
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override destroy(): void {
    this.monitorBox.destroy();
    this.searchBox.destroy();
    this.scrollView.destroy();
    super.destroy();
  }
}

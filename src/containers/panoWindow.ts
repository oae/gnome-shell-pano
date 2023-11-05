import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import Shell from '@girs/shell-12';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { MonitorBox } from '@pano/components/monitorBox';
import { PanoScrollView } from '@pano/components/panoScrollView';
import { SearchBox } from '@pano/components/searchBox';
import { EaseFunctionType } from '@pano/types/st';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { getV13KeyEvent } from '@pano/utils/compatibility';
import { ItemType } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getAlignment, getMonitorConstraint, isVertical } from '@pano/utils/ui';

@registerGObjectClass
export class PanoWindow extends St1.BoxLayout {
  private scrollView: PanoScrollView;
  private searchBox: SearchBox;
  private monitorBox: MonitorBox;
  private settings: Gio.Settings;
  //TODO: use St version >= 13 to get this types!!!, and than you can also use this.scrollView.vscroll.adjustment.ease
  ease: EaseFunctionType<typeof this>;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager) {
    super({
      name: 'pano-window',
      constraints: getMonitorConstraint(),
      style_class: 'pano-window',
      visible: false,
      vertical: true,
      reactive: true,
      opacity: 0,
      can_focus: true,
    });

    this.settings = getCurrentExtensionSettings(ext);
    this.setAlignment();

    const themeContext = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    this.setWindowDimensions(themeContext.scale_factor);
    themeContext.connect('notify::scale-factor', () => {
      this.setWindowDimensions(themeContext.scale_factor);
    });
    this.settings.connect('changed::item-size', () => {
      this.setWindowDimensions(themeContext.scale_factor);
    });
    this.settings.connect('changed::window-position', () => {
      this.setWindowDimensions(themeContext.scale_factor);
      this.setAlignment();
    });

    this.settings.connect('changed::window-background-color', () => {
      if (this.settings.get_boolean('is-in-incognito')) {
        this.set_style(
          `background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`,
        );
      } else {
        this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
      }
    });
    this.settings.connect('changed::incognito-window-background-color', () => {
      if (this.settings.get_boolean('is-in-incognito')) {
        this.set_style(
          `background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`,
        );
      } else {
        this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
      }
    });
    this.monitorBox = new MonitorBox();
    this.searchBox = new SearchBox(ext);
    this.scrollView = new PanoScrollView(ext, clipboardManager, this.searchBox);

    this.setupMonitorBox();
    this.setupScrollView();
    this.setupSearchBox();

    this.add_actor(this.searchBox);
    this.add_actor(this.scrollView);

    this.settings.connect('changed::is-in-incognito', () => {
      if (this.settings.get_boolean('is-in-incognito')) {
        this.add_style_class_name('incognito');
        this.set_style(
          `background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`,
        );
      } else {
        this.remove_style_class_name('incognito');
        this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
      }
    });

    if (this.settings.get_boolean('is-in-incognito')) {
      this.add_style_class_name('incognito');
      this.set_style(`background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`);
    } else {
      this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
    }
  }

  private setWindowDimensions(scaleFactor: number) {
    this.remove_style_class_name('vertical');
    if (isVertical(this.settings.get_uint('window-position'))) {
      this.add_style_class_name('vertical');
      this.set_width((this.settings.get_int('item-size') + 20) * scaleFactor);
    } else {
      this.set_height((this.settings.get_int('item-size') + 90) * scaleFactor);
    }
  }

  private setAlignment() {
    const [x_align, y_align] = getAlignment(this.settings.get_uint('window-position'));
    this.set_x_align(x_align);
    this.set_y_align(y_align);
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

  override vfunc_key_press_event(_event: Clutter.KeyEvent): boolean {
    const event = getV13KeyEvent(_event);
    if (event.get_key_symbol() === Clutter.KEY_Escape) {
      this.hide();
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override destroy(): void {
    this.monitorBox.destroy();
    this.searchBox.destroy();
    super.destroy();
  }
}

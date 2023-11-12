import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import GObject from '@girs/gobject-2.0';
import Meta from '@girs/meta-12';
import Shell from '@girs/shell-12';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass, SignalRepresentationType, SignalsDefinition } from '@pano/utils/gjs';
import { getPanoItemTypes, ICON_PACKS } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

export type SearchBoxSignalType =
  | 'search-text-changed'
  | 'search-item-select-shortcut'
  | 'search-focus-out'
  | 'search-submit';

interface SearchBoxSignals extends SignalsDefinition<SearchBoxSignalType> {
  'search-text-changed': SignalRepresentationType<
    [GObject.GType<string>, GObject.GType<string>, GObject.GType<boolean>]
  >;
  'search-item-select-shortcut': SignalRepresentationType<[GObject.GType<number>]>;
  'search-focus-out': Record<string, never>;
  'search-submit': Record<string, never>;
}
@registerGObjectClass
export class SearchBox extends St1.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, SearchBoxSignals> = {
    GTypeName: 'SearchBox',
    Signals: {
      'search-text-changed': {
        param_types: [GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN],
        accumulator: 0,
      },
      'search-item-select-shortcut': {
        param_types: [GObject.TYPE_INT],
        accumulator: 0,
      },
      'search-focus-out': {},
      'search-submit': {},
    },
  };

  private search: St1.Entry;
  private currentIndex: number | null = null;
  private showFavorites = false;
  private settings: Gio.Settings;
  private ext: ExtensionBase;

  constructor(ext: ExtensionBase) {
    super({
      x_align: Clutter.ActorAlign.CENTER,
      style_class: 'search-entry-container',
      vertical: false,
      track_hover: true,
      reactive: true,
    });

    this.ext = ext;
    const _ = gettext(ext);

    this.settings = getCurrentExtensionSettings(ext);

    const themeContext = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    this.search = new St1.Entry({
      can_focus: true,
      hint_text: _('Type to search, Tab to cycle'),
      natural_width: 300 * themeContext.scale_factor,
      height: 40 * themeContext.scale_factor,
      track_hover: true,
      primary_icon: this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'),
      secondary_icon: this.createSearchEntryIcon('starred-symbolic', 'search-entry-fav-icon'),
    });

    themeContext.connect('notify::scale-factor', () => {
      this.search.natural_width = 300 * themeContext.scale_factor;
      this.search.set_height(40 * themeContext.scale_factor);
    });

    this.search.connect('primary-icon-clicked', () => {
      this.focus();
      this.toggleItemType(false);
    });

    this.search.connect('secondary-icon-clicked', () => {
      this.focus();
      this.toggleFavorites();
    });

    this.search.clutter_text.connect('text-changed', () => {
      this.emitSearchTextChange();
    });

    this.search.clutter_text.connect('key-press-event', (_: St1.Entry, event: Clutter.Event) => {
      if (
        event.get_key_symbol() === Clutter.KEY_Down ||
        (event.get_key_symbol() === Clutter.KEY_Right &&
          (this.search.clutter_text.cursor_position === -1 || this.search.text?.length === 0))
      ) {
        this.emit('search-focus-out');
        return Clutter.EVENT_STOP;
      } else if (
        event.get_key_symbol() === Clutter.KEY_Right &&
        this.search.clutter_text.get_selection() !== null &&
        this.search.clutter_text.get_selection() === this.search.text
      ) {
        this.search.clutter_text.set_cursor_position(this.search.text?.length ?? 0);
        return Clutter.EVENT_STOP;
      }
      if (
        event.get_key_symbol() === Clutter.KEY_Return ||
        event.get_key_symbol() === Clutter.KEY_ISO_Enter ||
        event.get_key_symbol() === Clutter.KEY_KP_Enter
      ) {
        this.emit('search-submit');
        return Clutter.EVENT_STOP;
      }

      if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
        this.emit('search-item-select-shortcut', event.get_key_symbol() - 49);
        return Clutter.EVENT_STOP;
      }

      if (
        event.get_key_symbol() === Clutter.KEY_Tab ||
        event.get_key_symbol() === Clutter.KEY_ISO_Left_Tab ||
        event.get_key_symbol() === Clutter.KEY_KP_Tab
      ) {
        this.toggleItemType(event.has_shift_modifier());

        return Clutter.EVENT_STOP;
      }
      if (event.get_key_symbol() === Clutter.KEY_BackSpace && this.search.text?.length === 0) {
        this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
        this.currentIndex = null;
        this.emitSearchTextChange();

        return Clutter.EVENT_STOP;
      }

      if (event.get_key_symbol() === Clutter.KEY_Alt_L || event.get_key_symbol() === Clutter.KEY_Alt_R) {
        this.toggleFavorites();
        this.emitSearchTextChange();

        return Clutter.EVENT_STOP;
      }

      return Clutter.EVENT_PROPAGATE;
    });
    this.add_child(this.search);
    this.setStyle();
    this.settings.connect('changed::search-bar-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::search-bar-font-size', this.setStyle.bind(this));
  }

  private setStyle() {
    const searchBarFontFamily = this.settings.get_string('search-bar-font-family');
    const searchBarFontSize = this.settings.get_int('search-bar-font-size');
    this.search.set_style(`font-family: ${searchBarFontFamily}; font-size: ${searchBarFontSize}px;`);
  }

  toggleItemType(hasShift: boolean) {
    const panoItemTypes = getPanoItemTypes(this.ext);
    // increment or decrement the current index based on the shift modifier
    if (hasShift) {
      this.currentIndex = this.currentIndex === null ? Object.keys(panoItemTypes).length - 1 : this.currentIndex - 1;
    } else {
      this.currentIndex = this.currentIndex === null ? 0 : this.currentIndex + 1;
    }
    // if the index is out of bounds, set it to the other end
    if (this.currentIndex < 0 || this.currentIndex >= Object.keys(panoItemTypes).length) {
      this.currentIndex = null;
    }

    if (null == this.currentIndex) {
      this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
    } else {
      this.search.set_primary_icon(
        this.createSearchEntryIcon(
          Gio.icon_new_for_string(
            `${this.ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
              panoItemTypes[Object.keys(panoItemTypes)[this.currentIndex]].iconPath
            }`,
          ),
          'search-entry-icon',
        ),
      );
    }

    this.settings.connect('changed::icon-pack', () => {
      if (null == this.currentIndex) {
        this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
      } else {
        this.search.set_primary_icon(
          this.createSearchEntryIcon(
            Gio.icon_new_for_string(
              `${this.ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
                panoItemTypes[Object.keys(panoItemTypes)[this.currentIndex]].iconPath
              }`,
            ),
            'search-entry-icon',
          ),
        );
      }
    });

    this.emitSearchTextChange();
  }

  private createSearchEntryIcon(iconNameOrProto: string | Gio.Icon, styleClass: string) {
    const icon = new St1.Icon({
      style_class: styleClass,
      icon_size: 13,
      track_hover: true,
    });

    if (typeof iconNameOrProto === 'string') {
      icon.set_icon_name(iconNameOrProto);
    } else {
      icon.set_gicon(iconNameOrProto);
    }

    icon.connect('enter-event', () => {
      Shell.Global.get().display.set_cursor(Meta.Cursor.POINTING_HAND);
    });
    icon.connect('motion-event', () => {
      Shell.Global.get().display.set_cursor(Meta.Cursor.POINTING_HAND);
    });
    icon.connect('leave-event', () => {
      Shell.Global.get().display.set_cursor(Meta.Cursor.DEFAULT);
    });

    return icon;
  }

  toggleFavorites() {
    const icon = this.search.get_secondary_icon() as St1.Icon;
    if (this.showFavorites) {
      icon.remove_style_class_name('active');
    } else {
      icon.add_style_class_name('active');
    }
    this.showFavorites = !this.showFavorites;
    this.emitSearchTextChange();
  }

  emitSearchTextChange() {
    const panoItemTypes = getPanoItemTypes(this.ext);
    let itemType: string | null = null;
    if (this.currentIndex !== null) {
      itemType = Object.keys(panoItemTypes)[this.currentIndex];
    }
    this.emit('search-text-changed', this.search.text, itemType || '', this.showFavorites);
  }

  focus() {
    this.search.grab_key_focus();
  }

  removeChar() {
    this.search.text = this.search.text?.slice(0, -1) ?? '';
  }

  appendText(text: string) {
    this.search.text += text;
  }

  selectAll() {
    this.search.clutter_text.set_selection(0, this.search.text?.length ?? 0);
  }

  clear() {
    this.search.text = '';
  }

  getText(): string {
    return this.search.text ?? '';
  }
}

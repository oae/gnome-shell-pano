import {
  ActorAlign,
  Event,
  KEY_Alt_L,
  KEY_Alt_R,
  KEY_BackSpace,
  KEY_Down,
  KEY_ISO_Enter,
  KEY_ISO_Left_Tab,
  KEY_KP_Enter,
  KEY_KP_Tab,
  KEY_Return,
  KEY_Right,
  KEY_Tab,
} from '@gi-types/clutter10';
import { icon_new_for_string, IconPrototype, Settings } from '@gi-types/gio2';
import { MetaInfo, TYPE_BOOLEAN, TYPE_INT, TYPE_STRING } from '@gi-types/gobject2';
import { Cursor } from '@gi-types/meta10';
import { Global } from '@gi-types/shell0';
import { BoxLayout, Entry, Icon, ThemeContext } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS, PanoItemTypes } from '@pano/utils/panoItemType';
import { _, getCurrentExtension, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class SearchBox extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'SearchBox',
    Signals: {
      'search-text-changed': {
        param_types: [TYPE_STRING, TYPE_STRING, TYPE_BOOLEAN],
        accumulator: 0,
      },
      'search-item-select-shortcut': {
        param_types: [TYPE_INT],
        accumulator: 0,
      },
      'search-focus-out': {},
      'search-submit': {},
    },
  };

  private search: Entry;
  private currentIndex: number | null = null;
  private showFavorites = false;
  private settings: Settings;

  constructor() {
    super({
      x_align: ActorAlign.CENTER,
      style_class: 'search-entry-container',
      vertical: false,
    });

    this.settings = getCurrentExtensionSettings();

    const themeContext = ThemeContext.get_for_stage(Global.get().get_stage());

    this.search = new Entry({
      can_focus: true,
      hint_text: _('Type to search, Tab to cycle'),
      track_hover: true,
      width: 300 * themeContext.scaleFactor,
      primary_icon: this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'),
      secondary_icon: this.createSearchEntryIcon('starred-symbolic', 'search-entry-fav-icon'),
    });

    themeContext.connect('notify::scale-factor', () => {
      const { scaleFactor } = ThemeContext.get_for_stage(Global.get().get_stage());
      this.search.set_width(300 * scaleFactor);
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

    this.search.clutter_text.connect('key-press-event', (_: Entry, event: Event) => {
      if (
        event.get_key_symbol() === KEY_Down ||
        (event.get_key_symbol() === KEY_Right &&
          (this.search.clutter_text.cursor_position === -1 || this.search.text.length === 0))
      ) {
        this.emit('search-focus-out');
      } else if (
        event.get_key_symbol() === KEY_Right &&
        this.search.clutter_text.get_selection() !== null &&
        this.search.clutter_text.get_selection() === this.search.text
      ) {
        this.search.clutter_text.set_cursor_position(this.search.text.length);
      }
      if (
        event.get_key_symbol() === KEY_Return ||
        event.get_key_symbol() === KEY_ISO_Enter ||
        event.get_key_symbol() === KEY_KP_Enter
      ) {
        this.emit('search-submit');
      }

      if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
        this.emit('search-item-select-shortcut', event.get_key_symbol() - 49);
      }

      if (
        event.get_key_symbol() === KEY_Tab ||
        event.get_key_symbol() === KEY_ISO_Left_Tab ||
        event.get_key_symbol() === KEY_KP_Tab
      ) {
        this.toggleItemType(event.has_shift_modifier());
      }
      if (event.get_key_symbol() === KEY_BackSpace && this.search.text.length === 0) {
        this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
        this.currentIndex = null;
        this.emitSearchTextChange();
      }
      if (event.get_key_symbol() === KEY_Alt_L || event.get_key_symbol() === KEY_Alt_R) {
        this.toggleFavorites();
        this.emitSearchTextChange();
      }
    });
    this.add_child(this.search);
  }

  toggleItemType(hasShift: boolean) {
    // increment or decrement the current index based on the shift modifier
    if (hasShift) {
      this.currentIndex = this.currentIndex === null ? Object.keys(PanoItemTypes).length - 1 : this.currentIndex - 1;
    } else {
      this.currentIndex = this.currentIndex === null ? 0 : this.currentIndex + 1;
    }
    // if the index is out of bounds, set it to the other end
    if (this.currentIndex < 0 || this.currentIndex >= Object.keys(PanoItemTypes).length) {
      this.currentIndex = null;
    }

    if (null == this.currentIndex) {
      this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
    } else {
      this.search.set_primary_icon(
        this.createSearchEntryIcon(
          icon_new_for_string(
            `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
              ICON_PACKS[this.settings.get_uint('icon-pack')]
            }-${PanoItemTypes[Object.keys(PanoItemTypes)[this.currentIndex]].iconPath}`,
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
            icon_new_for_string(
              `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
                ICON_PACKS[this.settings.get_uint('icon-pack')]
              }-${PanoItemTypes[Object.keys(PanoItemTypes)[this.currentIndex]].iconPath}`,
            ),
            'search-entry-icon',
          ),
        );
      }
    });

    this.emitSearchTextChange();
  }

  private createSearchEntryIcon(iconNameOrProto: string | IconPrototype, styleClass: string) {
    const icon = new Icon({
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
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
    });
    icon.connect('motion-event', () => {
      Global.get().display.set_cursor(Cursor.POINTING_HAND);
    });
    icon.connect('leave-event', () => {
      Global.get().display.set_cursor(Cursor.DEFAULT);
    });

    return icon;
  }

  toggleFavorites() {
    const icon = this.search.get_secondary_icon() as Icon;
    if (this.showFavorites) {
      icon.remove_style_class_name('active');
    } else {
      icon.add_style_class_name('active');
    }
    this.showFavorites = !this.showFavorites;
    this.emitSearchTextChange();
  }

  emitSearchTextChange() {
    let itemType: string | null = null;
    if (this.currentIndex !== null) {
      itemType = Object.keys(PanoItemTypes)[this.currentIndex];
    }
    this.emit('search-text-changed', this.search.text, itemType || '', this.showFavorites);
  }

  focus() {
    this.search.grab_key_focus();
  }

  removeChar() {
    this.search.text = this.search.text.slice(0, -1);
  }

  appendText(text: string) {
    this.search.text += text;
  }

  selectAll() {
    this.search.clutter_text.set_selection(0, this.search.text.length);
  }

  clear() {
    this.search.text = '';
  }

  getText(): string {
    return this.search.text;
  }
}

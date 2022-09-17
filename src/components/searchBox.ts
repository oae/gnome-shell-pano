import { ActorAlign, Event, KEY_Down, KEY_ISO_Enter, KEY_KP_Enter, KEY_Return, KEY_Right } from '@gi-types/clutter10';
import { MetaInfo, TYPE_STRING } from '@gi-types/gobject2';
import { BoxLayout, Entry, Icon } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';

@registerGObjectClass
export class SearchBox extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'SearchBox',
    Signals: {
      'search-text-changed': {
        param_types: [TYPE_STRING],
        accumulator: 0,
      },
      'search-focus-out': {},
      'search-submit': {},
    },
  };

  private search: Entry;

  constructor() {
    super({
      x_align: ActorAlign.CENTER,
      style_class: 'search-entry-container',
      vertical: false,
    });

    this.search = new Entry({
      can_focus: true,
      hint_text: _('Type to search'),
      track_hover: true,
      width: 300,
      primary_icon: new Icon({
        style_class: 'search-entry-icon',
        icon_name: 'edit-find-symbolic',
        icon_size: 13,
      }),
    });

    this.search.clutter_text.connect('text-changed', () => {
      this.emit('search-text-changed', this.search.text);
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
    });
    this.add_child(this.search);
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

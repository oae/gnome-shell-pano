import { ActionRow, StatusPage, Window } from '@gi-types/adw1';
import {
  EVENT_STOP,
  KEY_0,
  KEY_9,
  KEY_A,
  KEY_a,
  KEY_Arabic_comma,
  KEY_Arabic_sukun,
  KEY_Cyrillic_HARDSIGN,
  KEY_Down,
  KEY_End,
  KEY_Escape,
  KEY_Greek_ALPHAaccent,
  KEY_Greek_omega,
  KEY_Hangul_J_YeorinHieuh,
  KEY_Hangul_Kiyeog,
  KEY_hebrew_doublelowline,
  KEY_hebrew_taf,
  KEY_Home,
  KEY_kana_fullstop,
  KEY_KP_Enter,
  KEY_Left,
  KEY_Mode_switch,
  KEY_Page_Down,
  KEY_Page_Up,
  KEY_Return,
  KEY_Right,
  KEY_semivoicedsound,
  KEY_Serbian_dje,
  KEY_space,
  KEY_Tab,
  KEY_Thai_kokai,
  KEY_Thai_lekkao,
  KEY_Up,
  KEY_Z,
  KEY_z,
  ModifierType,
} from '@gi-types/gdk4';
import { Settings } from '@gi-types/gio2';
import {
  accelerator_get_default_mod_mask,
  accelerator_name_with_keycode,
  accelerator_valid,
  Align,
  EventControllerKey,
  ShortcutLabel,
} from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';

@registerGObjectClass
export class ShortcutRow extends ActionRow {
  private settings: Settings;
  constructor() {
    super({
      title: _('Global Shortcut'),
      subtitle: _('Allows you to toggle visibility of the clipboard manager'),
    });

    this.settings = getCurrentExtensionSettings();

    const shortcutLabel = new ShortcutLabel({
      disabled_text: _('Select a shortcut'),
      accelerator: this.settings.get_strv('global-shortcut')[0],
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.connect('changed::shortcut', () => {
      shortcutLabel.set_accelerator(this.settings.get_strv('global-shortcut')[0]);
    });

    this.connect('activated', () => {
      const ctl = new EventControllerKey();
      const content = new StatusPage({
        title: _('New shortcut'),
        icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
      });
      const editor = new Window({
        modal: true,
        transient_for: this.get_root() as Window,
        hide_on_close: true,
        width_request: 320,
        height_request: 240,
        resizable: false,
        content,
      });
      editor.add_controller(ctl);

      // See https://github.com/tuberry/color-picker/blob/1a278db139f00787e365fce5977d30b535529edb/color-picker%40tuberry/prefs.js
      ctl.connect('key-pressed', (_, keyval, keycode, state) => {
        let mask = state & accelerator_get_default_mod_mask();
        mask &= ~ModifierType.LOCK_MASK;
        if (!mask && keyval === KEY_Escape) {
          editor.close();
          return EVENT_STOP;
        }
        if (!isValidBinding(mask, keycode, keyval) || !isValidAccel(mask, keyval)) {
          return EVENT_STOP;
        }

        this.settings.set_strv('global-shortcut', [accelerator_name_with_keycode(null, keyval, keycode, mask)]);
        editor.destroy();

        return EVENT_STOP;
      });
      editor.present();
    });

    this.add_suffix(shortcutLabel);
    this.set_activatable_widget(shortcutLabel);
  }
}

export const keyvalIsForbidden = (keyval) => {
  return [
    KEY_Home,
    KEY_Left,
    KEY_Up,
    KEY_Right,
    KEY_Down,
    KEY_Page_Up,
    KEY_Page_Down,
    KEY_End,
    KEY_Tab,
    KEY_KP_Enter,
    KEY_Return,
    KEY_Mode_switch,
  ].includes(keyval);
};

export const isValidAccel = (mask, keyval) => {
  return accelerator_valid(keyval, mask) || (keyval === KEY_Tab && mask !== 0);
};

export const isValidBinding = (mask, keycode, keyval) => {
  return !(
    mask === 0 ||
    (mask === ModifierType.SHIFT_MASK &&
      keycode !== 0 &&
      ((keyval >= KEY_a && keyval <= KEY_z) ||
        (keyval >= KEY_A && keyval <= KEY_Z) ||
        (keyval >= KEY_0 && keyval <= KEY_9) ||
        (keyval >= KEY_kana_fullstop && keyval <= KEY_semivoicedsound) ||
        (keyval >= KEY_Arabic_comma && keyval <= KEY_Arabic_sukun) ||
        (keyval >= KEY_Serbian_dje && keyval <= KEY_Cyrillic_HARDSIGN) ||
        (keyval >= KEY_Greek_ALPHAaccent && keyval <= KEY_Greek_omega) ||
        (keyval >= KEY_hebrew_doublelowline && keyval <= KEY_hebrew_taf) ||
        (keyval >= KEY_Thai_kokai && keyval <= KEY_Thai_lekkao) ||
        (keyval >= KEY_Hangul_Kiyeog && keyval <= KEY_Hangul_J_YeorinHieuh) ||
        (keyval === KEY_space && mask === 0) ||
        keyvalIsForbidden(keyval)))
  );
};

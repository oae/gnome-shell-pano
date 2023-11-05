import Adw from '@girs/adw-1';
import Gdk4 from '@girs/gdk-4.0';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

import { getAcceleratorName } from './helper';

@registerGObjectClass
export class ShortcutRow extends Adw.ActionRow {
  private settings: Gio.Settings;
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Global Shortcut'),
      subtitle: _('Allows you to toggle visibility of the clipboard manager'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const shortcutLabel = new Gtk4.ShortcutLabel({
      disabled_text: _('Select a shortcut'),
      accelerator: this.settings.get_strv('global-shortcut')[0],
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.connect('changed::global-shortcut', () => {
      shortcutLabel.set_accelerator(this.settings.get_strv('global-shortcut')[0]);
    });

    this.connect('activated', () => {
      const ctl = new Gtk4.EventControllerKey();
      const content = new Adw.StatusPage({
        title: _('New shortcut'),
        icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
      });
      const editor = new Adw.Window({
        modal: true,
        transient_for: this.get_root() as Adw.Window,
        hide_on_close: true,
        width_request: 320,
        height_request: 240,
        resizable: false,
        content,
      });
      editor.add_controller(ctl);

      // See https://github.com/tuberry/color-picker/blob/1a278db139f00787e365fce5977d30b535529edb/color-picker%40tuberry/prefs.js
      ctl.connect('key-pressed', (_, keyval, keycode, state) => {
        let mask = state & Gtk4.accelerator_get_default_mod_mask();
        mask &= ~Gdk4.ModifierType.LOCK_MASK;
        if (!mask && keyval === Gdk4.KEY_Escape) {
          editor.close();
          return Gdk4.EVENT_STOP;
        }
        if (!isValidBinding(mask, keycode, keyval) || !isValidAccel(mask, keyval)) {
          return Gdk4.EVENT_STOP;
        }

        const globalShortcut = getAcceleratorName(keyval, keycode, mask, 'global-shortcut');

        if (globalShortcut === null) {
          return Gdk4.EVENT_STOP;
        }
        this.settings.set_strv('global-shortcut', [globalShortcut]);
        editor.destroy();

        return Gdk4.EVENT_STOP;
      });
      editor.present();
    });

    this.add_suffix(shortcutLabel);
    this.set_activatable_widget(shortcutLabel);
  }
}

export const keyvalIsForbidden = (keyval: number) => {
  return [
    Gdk4.KEY_Home,
    Gdk4.KEY_Left,
    Gdk4.KEY_Up,
    Gdk4.KEY_Right,
    Gdk4.KEY_Down,
    Gdk4.KEY_Page_Up,
    Gdk4.KEY_Page_Down,
    Gdk4.KEY_End,
    Gdk4.KEY_Tab,
    Gdk4.KEY_KP_Enter,
    Gdk4.KEY_Return,
    Gdk4.KEY_Mode_switch,
  ].includes(keyval);
};

export const isValidAccel = (mask: number, keyval: number) => {
  return Gtk4.accelerator_valid(keyval, mask) || (keyval === Gdk4.KEY_Tab && mask !== 0);
};

export const isValidBinding = (mask: number, keycode: number, keyval: number) => {
  return !(
    mask === 0 ||
    (mask === Gdk4.ModifierType.SHIFT_MASK &&
      keycode !== 0 &&
      ((keyval >= Gdk4.KEY_a && keyval <= Gdk4.KEY_z) ||
        (keyval >= Gdk4.KEY_A && keyval <= Gdk4.KEY_Z) ||
        (keyval >= Gdk4.KEY_0 && keyval <= Gdk4.KEY_9) ||
        (keyval >= Gdk4.KEY_kana_fullstop && keyval <= Gdk4.KEY_semivoicedsound) ||
        (keyval >= Gdk4.KEY_Arabic_comma && keyval <= Gdk4.KEY_Arabic_sukun) ||
        (keyval >= Gdk4.KEY_Serbian_dje && keyval <= Gdk4.KEY_Cyrillic_HARDSIGN) ||
        (keyval >= Gdk4.KEY_Greek_ALPHAaccent && keyval <= Gdk4.KEY_Greek_omega) ||
        (keyval >= Gdk4.KEY_hebrew_doublelowline && keyval <= Gdk4.KEY_hebrew_taf) ||
        (keyval >= Gdk4.KEY_Thai_kokai && keyval <= Gdk4.KEY_Thai_lekkao) ||
        (keyval >= Gdk4.KEY_Hangul_Kiyeog && keyval <= Gdk4.KEY_Hangul_J_YeorinHieuh) ||
        (keyval === Gdk4.KEY_space && mask === 0) ||
        keyvalIsForbidden(keyval)))
  );
};

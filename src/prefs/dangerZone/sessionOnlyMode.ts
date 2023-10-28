import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class SessionOnlyModeRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Session Only Mode'),
      subtitle: _('When enabled, Pano will clear all history on logout/restart/shutdown.'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const sessionOnlySwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('session-only-mode'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('session-only-mode', sessionOnlySwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(sessionOnlySwitch);
    this.set_activatable_widget(sessionOnlySwitch);
  }
}

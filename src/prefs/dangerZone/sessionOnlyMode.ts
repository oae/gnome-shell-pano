import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class SessionOnlyModeRow extends ActionRow {
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

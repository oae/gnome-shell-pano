import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class WiggleIndicatorRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Wiggle Indicator'),
      subtitle: _('Wiggles the indicator on panel'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const wiggleIndicatorSwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('wiggle-indicator'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('wiggle-indicator', wiggleIndicatorSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(wiggleIndicatorSwitch);
    this.set_activatable_widget(wiggleIndicatorSwitch);
  }
}

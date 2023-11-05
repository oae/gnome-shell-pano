import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class ShowIndicatorRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Show Indicator'),
      subtitle: _('Shows an indicator on top panel'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const showIndicatorSwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('show-indicator'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('show-indicator', showIndicatorSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(showIndicatorSwitch);
    this.set_activatable_widget(showIndicatorSwitch);
  }
}

import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class WiggleIndicatorRow extends ActionRow {
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

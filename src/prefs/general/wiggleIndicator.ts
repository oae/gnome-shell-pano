import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class WiggleIndicatorRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    super({
      title: _('Wiggle Indicator'),
      subtitle: _('Wiggles the indicator on panel'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const wiggleIndicatorSwitch = new Switch({
      active: this.settings.get_boolean('wiggle-indicator'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('wiggle-indicator', wiggleIndicatorSwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(wiggleIndicatorSwitch);
    this.set_activatable_widget(wiggleIndicatorSwitch);
  }
}

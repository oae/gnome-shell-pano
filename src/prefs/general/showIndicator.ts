import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class ShowIndicatorRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Show Indicator'),
      subtitle: _('Shows an indicator on top panel'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const showIndicatorSwitch = new Switch({
      active: this.settings.get_boolean('show-indicator'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('show-indicator', showIndicatorSwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(showIndicatorSwitch);
    this.set_activatable_widget(showIndicatorSwitch);
  }
}

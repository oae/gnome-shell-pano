import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';

@registerGObjectClass
export class OfflineModeRow extends ActionRow {
  private settings: Settings;

  constructor() {
    super({
      title: _('Offline Mode'),
      subtitle: _('When enabled, Pano will not try to connect to internet'),
    });

    this.settings = getCurrentExtensionSettings();

    const offlineModeSwitch = new Switch({
      active: this.settings.get_boolean('offline-mode'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('offline-mode', offlineModeSwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(offlineModeSwitch);
    this.set_activatable_widget(offlineModeSwitch);
  }
}

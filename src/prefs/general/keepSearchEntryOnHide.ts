import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class KeepSearchEntryRow extends ActionRow {
  private settings: Settings;

  constructor() {
    super({
      title: _('Keep Search Entry'),
      subtitle: _('Keep search entry when Pano hides'),
    });

    this.settings = getCurrentExtensionSettings();

    const keepSearchEntrySwitch = new Switch({
      active: this.settings.get_boolean('keep-search-entry'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('keep-search-entry', keepSearchEntrySwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(keepSearchEntrySwitch);
    this.set_activatable_widget(keepSearchEntrySwitch);
  }
}

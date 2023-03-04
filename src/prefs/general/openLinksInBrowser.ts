import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';

@registerGObjectClass
export class OpenLinksInBrowserRow extends ActionRow {
  private settings: Settings;

  constructor() {
    super({
      title: _('Open Links in Browser'),
      subtitle: _('Allow Pano to open links on your default browser'),
    });

    this.settings = getCurrentExtensionSettings();

    const openLinksInBrowser = new Switch({
      active: this.settings.get_boolean('open-links-in-browser'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('open-links-in-browser', openLinksInBrowser, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(openLinksInBrowser);
    this.set_activatable_widget(openLinksInBrowser);
  }
}

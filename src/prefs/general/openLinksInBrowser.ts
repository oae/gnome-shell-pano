import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class OpenLinksInBrowserRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    super({
      title: _('Open Links in Browser'),
      subtitle: _('Allow Pano to open links on your default browser'),
    });

    this.settings = getCurrentExtensionSettings(ext);

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

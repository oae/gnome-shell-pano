import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class OpenLinksInBrowserRow extends ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Open Links in Browser'),
      subtitle: _('Allow Pano to open links on your default browser'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const openLinksInBrowser = new Gtk4.Switch({
      active: this.settings.get_boolean('open-links-in-browser'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('open-links-in-browser', openLinksInBrowser, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(openLinksInBrowser);
    this.set_activatable_widget(openLinksInBrowser);
  }
}

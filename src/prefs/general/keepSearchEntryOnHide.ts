import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class KeepSearchEntryRow extends ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Keep Search Entry'),
      subtitle: _('Keep search entry when Pano hides'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const keepSearchEntrySwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('keep-search-entry'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('keep-search-entry', keepSearchEntrySwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(keepSearchEntrySwitch);
    this.set_activatable_widget(keepSearchEntrySwitch);
  }
}

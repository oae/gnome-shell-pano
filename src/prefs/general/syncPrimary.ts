import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class SyncPrimaryRow extends ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Sync Primary'),
      subtitle: _('Sync primary selection with clipboard selection'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const pasteOnSelectSwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('sync-primary'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('sync-primary', pasteOnSelectSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(pasteOnSelectSwitch);
    this.set_activatable_widget(pasteOnSelectSwitch);
  }
}

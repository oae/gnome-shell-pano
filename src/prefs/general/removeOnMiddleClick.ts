import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Gtk4 from '@girs/gtk-4.0';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class RemoveOnMiddleClickRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Remove on Middle Click'),
      subtitle: _('Allow Pano to remove clipboard items on middle click'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const removeOnMiddleClickSwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('remove-on-middle-click'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('remove-on-middle-click', removeOnMiddleClickSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(removeOnMiddleClickSwitch);
    this.set_activatable_widget(removeOnMiddleClickSwitch);
  }
}

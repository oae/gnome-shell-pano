import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
@registerGObjectClass
export class WatchExclusionsRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Watch Exclusions'),
      subtitle: _('When enabled, Pano will not track clipboard from excluded apps'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const watchExclusionsSwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('watch-exclusion-list'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('watch-exclusion-list', watchExclusionsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(watchExclusionsSwitch);
    this.set_activatable_widget(watchExclusionsSwitch);
  }
}

import Adw from '@girs/adw-1';
import Gdk4 from '@girs/gdk-4.0';
import { ExtensionPreferences, gettext as _ } from '@girs/gnome-shell/dist/extensions/prefs';
import Gtk4 from '@girs/gtk-4.0';
import { CustomizationPage } from '@pano/prefs/customization';
import { DangerZonePage } from '@pano/prefs/dangerZone';
import { GeneralPage } from '@pano/prefs/general';

export default class PanoExtensionPreferences extends ExtensionPreferences {
  override fillPreferencesWindow(window: Adw.PreferencesWindow) {
    window.add(new GeneralPage(this));

    const customizationPage = new CustomizationPage(this);

    window.add(customizationPage);
    window.add(new DangerZonePage(this));
    window.searchEnabled = true;

    const display = Gdk4.Display.get_default();
    if (display) {
      Gtk4.IconTheme.get_for_display(display).add_search_path(`${this.path}/icons/`);
    }
  }
}

import Adw from '@girs/adw-1';
import Gdk4 from '@girs/gdk-4.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionPreferences, gettext as _ } from '@gnome-shell/extensions/prefs';
import { CustomizationPage } from '@pano/prefs/customization';
import { DangerZonePage } from '@pano/prefs/dangerZone';
import { GeneralPage } from '@pano/prefs/general';
import { logger } from '@pano/utils/shell';

const debug = logger('prefs');

export default class PanoExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    window.add(new GeneralPage(this));
    window.add(new CustomizationPage(this));
    window.add(new DangerZonePage(this));
    window.search_enabled = true;

    const display = Gdk4.Display.get_default();
    if (display) {
      Gtk4.IconTheme.get_for_display(display).add_search_path(`${this.path}/icons/`);
    }
  }
  init(): void {
    debug('prefs initialized');
  }
}

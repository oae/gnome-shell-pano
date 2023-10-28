import { PreferencesWindow } from '@gi-types/adw1';
import { Display } from '@gi-types/gdk4';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionPreferences, gettext as _ } from '@gnome-shell/extensions/prefs';
import { CustomizationPage } from '@pano/prefs/customization';
import { DangerZonePage } from '@pano/prefs/dangerZone';
import { GeneralPage } from '@pano/prefs/general';
import { logger } from '@pano/utils/shell';

const debug = logger('prefs');

export default class PanoExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window: PreferencesWindow) {
    window.add(new GeneralPage(this));
    window.add(new CustomizationPage(this));
    window.add(new DangerZonePage(this));
    window.search_enabled = true;

    const display = Display.get_default();
    if (display) {
      Gtk4.IconTheme.get_for_display(display).add_search_path(`${this.path}/icons/`);
    }
  }
  init(): void {
    debug('prefs initialized');
  }
}

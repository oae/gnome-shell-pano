import { PreferencesWindow } from '@gi-types/adw1';
import { Display } from '@gi-types/gdk4';
import { IconTheme } from '@gi-types/gtk4';
import { CustomizationPage } from '@pano/prefs/customization';
import { DangerZonePage } from '@pano/prefs/dangerZone';
import { GeneralPage } from '@pano/prefs/general';
import { getCurrentExtension, logger } from '@pano/utils/shell';

const debug = logger('prefs');

export default class PanoExtensionPreferences /* extends ExtensionPreferences */ {
  fillPreferencesWindow(window: PreferencesWindow) {
    window.add(new GeneralPage());
    window.add(new CustomizationPage());
    window.add(new DangerZonePage());
    window.search_enabled = true;

    const display = Display.get_default();
    if (display) {
      IconTheme.get_for_display(display).add_search_path(`${getCurrentExtension(this).path}/icons/`);
    }
  }
  init(): void {
    debug('prefs initialized');
  }
}

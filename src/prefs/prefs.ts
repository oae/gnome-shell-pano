import { PreferencesWindow } from '@gi-types/adw1';
import { initTranslations, logger } from '@pano/utils/shell';
import { DangerZonePage } from '@pano/prefs/dangerZone';
import { GeneralPage } from '@pano/prefs/general';

const debug = logger('prefs');
const init = (): void => {
  debug('prefs initialized');
  initTranslations();
};

const fillPreferencesWindow = (window: PreferencesWindow) => {
  window.add(new GeneralPage());
  window.add(new DangerZonePage());
  window.search_enabled = true;
};

export default { init, fillPreferencesWindow };

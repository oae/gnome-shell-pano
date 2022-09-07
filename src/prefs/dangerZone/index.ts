import { PreferencesGroup, PreferencesPage } from '@gi-types/adw1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { ClearHistoryRow } from './clearHistory';

@registerGObjectClass
export class DangerZonePage extends PreferencesPage {
  constructor() {
    super({
      title: _('Danger Zone'),
      icon_name: 'app-remove-symbolic',
    });

    const dangerZoneGroup = new PreferencesGroup();
    dangerZoneGroup.add(new ClearHistoryRow());

    this.add(dangerZoneGroup);
  }
}

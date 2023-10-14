import { PreferencesGroup, PreferencesPage } from '@gi-types/adw1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { ClearHistoryRow } from '@pano/prefs/dangerZone/clearHistory';
import { SessionOnlyModeRow } from '@pano/prefs/dangerZone/sessionOnlyMode';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
@registerGObjectClass
export class DangerZonePage extends PreferencesPage {
  constructor(ext: ExtensionBase) {
    super({
      title: _('Danger Zone'),
      icon_name: 'user-trash-symbolic',
    });

    const dangerZoneGroup = new PreferencesGroup();
    dangerZoneGroup.add(new SessionOnlyModeRow(ext));
    dangerZoneGroup.add(new ClearHistoryRow());

    this.add(dangerZoneGroup);
  }
}

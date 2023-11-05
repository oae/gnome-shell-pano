import Adw from '@girs/adw-1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { ClearHistoryRow } from '@pano/prefs/dangerZone/clearHistory';
import { SessionOnlyModeRow } from '@pano/prefs/dangerZone/sessionOnlyMode';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';
@registerGObjectClass
export class DangerZonePage extends Adw.PreferencesPage {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Danger Zone'),
      icon_name: 'user-trash-symbolic',
    });

    const dangerZoneGroup = new Adw.PreferencesGroup();
    dangerZoneGroup.add(new SessionOnlyModeRow(ext));
    dangerZoneGroup.add(new ClearHistoryRow(ext));

    this.add(dangerZoneGroup);
  }
}

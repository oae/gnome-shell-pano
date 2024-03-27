import Adw from '@girs/adw-1';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { ExclusionGroup } from '@pano/prefs/general/exclusionGroup';
import { GeneralGroup } from '@pano/prefs/general/generalGroup';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

@registerGObjectClass
export class GeneralPage extends Adw.PreferencesPage {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('General'),
      iconName: 'preferences-system-symbolic',
    });

    this.add(new GeneralGroup(ext));
    this.add(new ExclusionGroup(ext));
  }
}

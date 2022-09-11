import { PreferencesPage } from '@gi-types/adw1';
import { ExclusionGroup } from '@pano/prefs/general/exclusionGroup';
import { GeneralGroup } from '@pano/prefs/general/generalGroup';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';

@registerGObjectClass
export class GeneralPage extends PreferencesPage {
  constructor() {
    super({
      title: _('General'),
      icon_name: 'preferences-system-symbolic',
    });

    this.add(new GeneralGroup());
    this.add(new ExclusionGroup());
  }
}

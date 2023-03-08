import { PreferencesPage } from '@gi-types/adw1';
import { CommonStyleGroup } from '@pano/prefs/customization/commonStyleGroup';
import { ItemStyleGroup } from '@pano/prefs/customization/itemStyleGroup';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';

@registerGObjectClass
export class CustomizationPage extends PreferencesPage {
  constructor() {
    super({
      title: _('Customization'),
      icon_name: 'emblem-photos-symbolic',
    });

    this.add(new CommonStyleGroup());
    this.add(new ItemStyleGroup());
  }
}

import { PreferencesPage } from '@gi-types/adw1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { CommonStyleGroup } from './commonStyleGroup';
import { ItemStyleGroup } from './itemStyleGroup';

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

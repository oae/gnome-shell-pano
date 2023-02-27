import { PreferencesGroup, PreferencesPage } from '@gi-types/adw1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { WindowHeightRow } from './windowHeight';

@registerGObjectClass
export class CustomizationPage extends PreferencesPage {
  constructor() {
    super({
      title: _('Customization'),
      icon_name: 'emblem-photos-symbolic',
    });

    const customizationGroup = new PreferencesGroup();
    customizationGroup.add(new WindowHeightRow());

    this.add(customizationGroup);
  }
}

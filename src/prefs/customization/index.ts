import { PreferencesPage } from '@gi-types/adw1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { CommonStyleGroup } from '@pano/prefs/customization/commonStyleGroup';
import { ItemStyleGroup } from '@pano/prefs/customization/itemStyleGroup';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

@registerGObjectClass
export class CustomizationPage extends PreferencesPage {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Customization'),
      icon_name: 'emblem-photos-symbolic',
    });

    this.add(new CommonStyleGroup(ext));
    this.add(new ItemStyleGroup(ext));
  }
}

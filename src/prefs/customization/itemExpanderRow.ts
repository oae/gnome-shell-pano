import { ExpanderRow } from '@gi-types/adw1';
import { Settings } from '@gi-types/gio2';
import { Image } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class ItemExpanderRow extends ExpanderRow {
  protected extensionSettings: Settings;

  constructor(title: string, subtitle: string, iconName: string) {
    super({
      title,
      subtitle,
    });

    this.extensionSettings = getCurrentExtensionSettings();

    const iconPack = this.extensionSettings.get_uint('icon-pack');

    const image = Image.new_from_icon_name(`${ICON_PACKS[iconPack]}-${iconName}`);

    this.extensionSettings.connect('changed::icon-pack', () => {
      const iconPack = this.extensionSettings.get_uint('icon-pack');
      image.set_from_icon_name(`${ICON_PACKS[iconPack]}-${iconName}`);
    });

    this.add_prefix(image);
  }
}

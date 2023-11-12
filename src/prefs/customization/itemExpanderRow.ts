import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class ItemExpanderRow extends Adw.ExpanderRow {
  protected extensionSettings: Gio.Settings;

  constructor(ext: ExtensionBase, title: string, subtitle: string, iconName: string) {
    super({
      title,
      subtitle,
    });

    this.extensionSettings = getCurrentExtensionSettings(ext);

    const iconPack = this.extensionSettings.get_uint('icon-pack');

    const image = Gtk4.Image.new_from_icon_name(`${ICON_PACKS[iconPack]}-${iconName}`);

    this.extensionSettings.connect('changed::icon-pack', () => {
      const iconPack = this.extensionSettings.get_uint('icon-pack');
      image.set_from_icon_name(`${ICON_PACKS[iconPack]}-${iconName}`);
    });

    this.add_prefix(image);
  }
}

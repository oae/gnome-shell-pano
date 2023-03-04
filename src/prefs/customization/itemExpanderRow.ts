import { ExpanderRow } from '@gi-types/adw1';
import { Image } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class ItemExpanderRow extends ExpanderRow {
  constructor(title: string, subtitle: string, iconName: string) {
    super({
      title,
      subtitle,
    });

    this.add_prefix(Image.new_from_icon_name(iconName));
  }
}

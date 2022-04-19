import { EllipsizeMode } from '@imports/pango1';
import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { markupCode } from '@pano/utils/pango';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from '@pano/components/panoItem';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  constructor(content: string, date: Date) {
    super(PanoItemTypes.CODE, date);
    this.body.style_class = [this.body.style_class, 'pano-item-body-code'].join(' ');

    const label = new Label({
      style_class: 'pano-item-body-code-content',
      clip_to_allocation: true,
    });
    label.clutter_text.use_markup = true;
    label.clutter_text.font_name = 'mono';
    label.clutter_text.set_markup(markupCode(content));
    label.clutter_text.ellipsize = EllipsizeMode.END;
    this.body.add_child(label);
  }
}

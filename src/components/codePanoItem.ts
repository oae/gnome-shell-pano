import { EllipsizeMode } from '@imports/pango1';
import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { markupCode } from '@pano/utils/pango';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from './panoItem';

@registerGObjectClass
export class CodePanoItem extends PanoItem {
  constructor(content: string, date: Date) {
    super(PanoItemTypes.CODE, date);
    const label = new Label({
      style: 'font-size: 13px',
    });
    this.body.style_class = 'pano-item-body pano-item-body-code';
    label.clutter_text.use_markup = true;
    label.clutter_text.font_name = 'mono';
    label.clutter_text.set_markup(markupCode(content));
    label.clutter_text.ellipsize = EllipsizeMode.END;
    label.clutter_text.height = 200;
    this.body.add_child(label);
  }
}

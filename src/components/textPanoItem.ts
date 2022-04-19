import { EllipsizeMode } from '@imports/pango1';
import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from '@pano/components/panoItem';

@registerGObjectClass
export class TextPanoItem extends PanoItem {
  constructor(content: string, date: Date) {
    super(PanoItemTypes.TEXT, date);
    this.body.style_class = [this.body.style_class, 'pano-item-body-text'].join(' ');
    const label = new Label({
      text: content,
      style_class: 'pano-item-body-text-content',
    });
    label.clutter_text.line_wrap = true;
    label.clutter_text.ellipsize = EllipsizeMode.END;
    this.body.add_child(label);
  }
}

import { Label } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from './panoItem';

@registerGObjectClass
export class TextPanoItem extends PanoItem {
  constructor(content: string, date: Date) {
    super(PanoItemTypes.TEXT, date);
    this.body.add_child(new Label({ text: content, style: 'color: #000' }));
  }
}

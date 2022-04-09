import { Widget } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class PanoItem extends Widget {
  constructor() {
    super({
      name: 'pano-item',
      visible: true,
      reactive: true,
      style_class: 'pano-item',
    });
  }
}

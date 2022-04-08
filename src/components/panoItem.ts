import { Color } from '@imports/clutter10';
import { registerClass } from '@imports/gobject2';
import { Widget } from '@imports/st1';

export const PanoItem = registerClass(
  {},
  class PanoItem extends Widget {
    constructor() {
      super({
        name: 'pano-item',
        visible: true,
        reactive: true,
        style_class: 'pano-item',
        height: 252,
        width: 252,
        background_color: Color.from_string('#000')[1],
      });
    }
  },
);

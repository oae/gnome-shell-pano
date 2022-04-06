import { ActorAlign, BindConstraint, BindCoordinate, Color } from '@imports/clutter10';
import { registerClass } from '@imports/gobject2';
import { Global } from '@imports/shell0';
import { Widget } from '@imports/st1';

const global = Global.get();

export const PanoWindow = registerClass(
  {},
  class PanoWindow extends Widget {
    _init() {
      super._init({
        name: 'pano-window',
        constraints: new BindConstraint({
          source: global.stage,
          coordinate: BindCoordinate.ALL,
        }),
        x_align: ActorAlign.FILL,
        y_align: ActorAlign.END,
        styleClass: 'pano-window',
        reactive: true,
        background_color: Color.from_pixel(0x000000cc),
        height: 300,
      });
    }
  },
);

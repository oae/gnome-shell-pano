import type Clutter from '@girs/clutter-12';
import type St2 from '@girs/st-12';

export interface LightboxParams extends St.Bin.ConstructorProperties {
  active?: boolean;
  inhibitEvents?: boolean;
  width?: number;
  height?: number;
  fadeFactor?: number;
}

export class Lightbox extends St2.Bin {
  active: boolean;

  constructor(container: Clutter.Container, params: LightboxParams);

  highlight(window: Clutter.Actor): void;

  set(params: any): void;

  lightOn(fadeInTime?: number): void;
  lightOff(fadeOutTime?: number): void;
}

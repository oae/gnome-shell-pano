/* eslint-disable @typescript-eslint/ban-types */
import { Actor, AnimationMode } from '@gi-types/clutter10';

export {};

declare global {
  export const imports: {
    lang: any;
    ui: {
      layout: any;
      main: {
        notify: (arg: string) => void;
        panel: any;
        wm: any;
        layoutManager: {
          monitors: Monitor[];
          primaryIndex: number;
          addChrome(param: any, options?: any): any;
          removeChrome(param: any): any;
          addTopChrome(param: any, options?: any): any;
        };
      };
      panelMenu: any;
      popupMenu: any;
      switcherPopup: {
        SwitcherPopup: any;
      };
    };
    misc: {
      extensionUtils: {
        getCurrentExtension: () => any;
        getSettings: () => any;
      };
      config: any;
    };
    byteArray: {
      fromString: (input: string) => Uint8Array;
      fromArray: (input: number[]) => any;
      fromGBytes: (input: any) => Uint8Array;
      toString: (x: Uint8Array) => string;
    };
  };
  export interface Monitor {
    width: number;
    height: number;
    x: number;
    y: number;
  }

  export const log: (arg: any) => void;
  export const _: (arg: string) => string;
}

type AnimatableActorFields =
  | 'fixed_x'
  | 'fixed_y'
  | 'height'
  | 'margin_bottom'
  | 'margin_left'
  | 'margin_right'
  | 'margin_top'
  | 'min_height'
  | 'min_width'
  | 'natural_height'
  | 'natural_width'
  | 'opacity'
  | 'pivot_point_z'
  | 'rotation_angle_x'
  | 'rotation_angle_y'
  | 'rotation_angle_z'
  | 'scale_x'
  | 'scale_y'
  | 'scale_z'
  | 'translation_x'
  | 'translation_y'
  | 'translation_z'
  | 'width'
  | 'x'
  | 'y'
  | 'z_position';

interface EasingParams {
  // milliseconds
  duration: number;
  // milliseconds
  delay?: number;
  mode?: AnimationMode;
  repeatCount?: number;
  autoReverse?: boolean;
  onComplete?: () => void;
  onStopped?: (isFinished: boolean) => void;
}

// Any number of extra fields for the properties to be animated (e.g. "opacity: 0").
interface EasingParamsWithProperties extends EasingParams, Partial<Pick<Actor, AnimatableActorFields>> {}

declare module '@gi-types/clutter10' {
  interface Actor {
    ease(params: EasingParamsWithProperties): void;
  }
}

declare module '@gi-types/st1' {
  interface Adjustment {
    ease(target: any, params: EasingParamsWithProperties): void;
  }
}

declare module '@gi-types/gobject2' {
  export interface MetaInfo {
    GTypeName: string;
    GTypeFlags?: TypeFlags;
    Implements?: Function[];
    Properties?: { [K: string]: ParamSpec };
    Signals?: { [K: string]: SignalDefinition };
    Requires?: Function[];
    CssName?: string;
    Template?: string;
    Children?: string[];
    InternalChildren?: string[];
  }
}

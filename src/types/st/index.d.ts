/* eslint-disable @typescript-eslint/ban-types */
import Clutter from '@girs/clutter-12';

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
  mode?: Clutter.AnimationMode;
  repeatCount?: number;
  autoReverse?: boolean;
  onComplete?: () => void;
  onStopped?: (isFinished: boolean) => void;
}

// Any number of extra fields for the properties to be animated (e.g. "opacity: 0").
interface EasingParamsWithProperties extends EasingParams, Partial<Pick<Clutter.Actor, AnimatableActorFields>> {}

export type EaseFunctionType<T> = (this: T, params: EasingParamsWithProperties) => void;

export type EaseFunctionTypeStandalone<T = unknown> = (target: T, params: EasingParamsWithProperties) => void;

export interface Adjustment {
  ease: EaseFunctionTypeStandalone;
}

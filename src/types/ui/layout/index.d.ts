import type Clutter from '@girs/clutter-12';

export {
  Geometry,
  HotCorner,
  LayoutManager,
  Monitor,
  //MonitorConstraint,
  PressureBarrier,
  ScreenTransition,
  UiActor,
} from '@girs/gnome-shell/src/ui/layout';

export interface MonitorConstraintProps {
  primary?: boolean;
  index?: number;
  workArea?: boolean;
}

export class MonitorConstraint extends Clutter.Constraint {
  protected _primary: boolean;
  protected _index: number;
  protected _workArea: boolean;

  public primary: boolean;
  public index: number;
  public workArea: boolean;

  constructor(props: Clutter.Constraint.ConstructorProperties & MonitorConstraintProps);
  public _init(props: Clutter.Constraint.ConstructorProperties & MonitorConstraintProps): void;

  public vfunc_update_allocation(actor: Clutter.Actor, actorBox: Clutter.ActorBox): void;
}

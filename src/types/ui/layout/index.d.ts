import type Clutter from '@girs/clutter-12';
import GnomeShell from '@girs/gnome-shell';

//TODO: how to to this in a better way
export type Monitor = typeof GnomeShell.ui.layout.Monitor;
export class MonitorConstraint extends GnomeShell.ui.layout.MonitorConstraint {
  constructor(props: Clutter.Constraint.ConstructorProperties) {
    super(props);
  }
}

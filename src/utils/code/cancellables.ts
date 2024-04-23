import Gio from 'gi://Gio?version=2.0';

import { ActiveCollection, type ActiveWrapper } from './active';

export type CancellableWrapper = ActiveWrapper<Gio.Cancellable>;

export class CancellableCollection extends ActiveCollection<Gio.Cancellable> {
  _cancel(cancellable: Gio.Cancellable) {
    cancellable.cancel();
  }
}

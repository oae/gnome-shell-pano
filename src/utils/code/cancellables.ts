import Gio from 'gi://Gio?version=2.0';

export type CancellableWrapper = {
  value: Gio.Cancellable;
  id: string;
};

export class CancellableCollection {
  private cancellables: Record<string, Gio.Cancellable> = {};

  getNew(): CancellableWrapper {
    const id = new Date().getUTCMilliseconds().toString();
    const cancellable = new Gio.Cancellable();

    this.cancellables[id] = cancellable;

    return { id, value: cancellable };
  }

  remove(cancellable: CancellableWrapper | undefined) {
    if (cancellable) {
      delete this.cancellables[cancellable.id];
    }
  }

  removeAll() {
    for (const cancellable of Object.values(this.cancellables)) {
      cancellable.cancel();
    }
  }
}

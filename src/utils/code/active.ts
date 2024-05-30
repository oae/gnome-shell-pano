import GLib from '@girs/glib-2.0';

export type ActiveWrapper<T> = {
  value: T;
  uuid: string;
};

export abstract class ActiveCollection<T> {
  private active: Record<string, T> = {};

  //c an be overridden, to change the default implementation, if you e.g. can use the time, the default implementation doesn't use the time, since that's risky if new objects are added in under a ms (which not unlikely in some events)
  protected getNewUUID(): string {
    return GLib.uuid_string_random();
  }

  add(value: T): ActiveWrapper<T> {
    const uuid = this.getNewUUID();
    this.active[uuid] = value;

    return { uuid, value };
  }

  remove(value: ActiveWrapper<T> | undefined) {
    if (value) {
      this._remove(value.uuid);
    }
  }

  private _remove(uuid: string) {
    delete this.active[uuid];
  }

  abstract _cancel(element: T): void;

  isActive(value: ActiveWrapper<T>) {
    return this.active[value.uuid] !== undefined;
  }

  get amount(): number {
    return Object.keys(this.active).length;
  }

  cancelAll() {
    for (const [key, value] of Object.entries(this.active)) {
      this._remove(key);
      this._cancel(value);
    }
    this.active = {};
  }
}

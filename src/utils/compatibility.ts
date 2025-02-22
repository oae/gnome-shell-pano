import GLib from '@girs/glib-2.0';
import { PACKAGE_VERSION } from '@girs/gnome-shell/dist/misc/config';
import { Notification, Source as MessageTraySource } from '@girs/gnome-shell/dist/ui/messageTray';
import St from '@girs/st-16';

// compatibility functions to check if a specific gnome-shell is used
export function isGnomeVersion(version: number): boolean {
  const [major, _minor, _patch, ..._rest]: Array<number | undefined> = PACKAGE_VERSION.split('.').map((num) => {
    const result = parseInt(num);
    if (isNaN(result)) {
      return undefined;
    }
    return result;
  });

  if (major === undefined) {
    return PACKAGE_VERSION.includes(version.toString());
  }

  return major === version;
}

export function isOneGnomeVersion(versions: number[]): boolean {
  for (const version of versions) {
    const isVersion = isGnomeVersion(version);
    if (isVersion) {
      return true;
    }
  }

  return false;
}

// compatibility check functions for gnome-shell 47

// this check if it is gnome 47 or higher, which includes all supported versions above and inclusive gnome 47
export function isGnome47OrHigher(): boolean {
  return isOneGnomeVersion([47, 48]);
}

// compatibility check functions for gnome-shell 45 / 46

function hasGnome45LikeNotifications(): boolean {
  return MessageTraySource.prototype.addNotification === undefined;
}

// actual compatibility functions

export function newNotification(
  source: MessageTraySource,
  text: string,
  banner: string,
  transient_: boolean,
  params: Notification.ConstructorProps,
): Notification {
  if (hasGnome45LikeNotifications()) {
    // @ts-expect-error gnome 45 type
    const notification = new Notification(source, text, banner, {
      datetime: GLib.DateTime.new_now_local(),
      ...params,
    });

    (notification as any as { setTransient: (value: boolean) => void }).setTransient(transient_);
    return notification;
  }

  return new Notification({
    source: source as MessageTraySource,
    title: text,
    body: banner,
    datetime: GLib.DateTime.new_now_local(),
    isTransient: transient_,
    ...params,
  });
}

export function newMessageTraySource(title: string, iconName: string): MessageTraySource {
  if (hasGnome45LikeNotifications()) {
    // @ts-expect-error gnome 45 type
    return new MessageTraySource(title, iconName);
  }

  return new MessageTraySource({ title, iconName });
}

export function addNotification(source: MessageTraySource, notification: Notification): void {
  if ((source as any as { showNotification: undefined | any }).showNotification !== undefined) {
    // @ts-expect-error gnome 45 type, can also be in some earlier versions of gnome 46, so using an explicit check for undefined, so that it works everywhere
    source.showNotification(notification);
  } else {
    (source as MessageTraySource).addNotification(notification as Notification);
  }
}

export function scrollViewAddChild(scrollView: St.ScrollView, actor: St.Scrollable): void {
  if ((scrollView as any as { add_actor: undefined | any }).add_actor !== undefined) {
    // @ts-expect-error gnome 45 type, or even some gnome 46 distros do support that, so using this check, instead of isGnome45()!
    scrollView.add_actor(actor);
  } else {
    scrollView.set_child(actor);
  }
}

interface HasAdjustment {
  adjustment: St.Adjustment;
}

// GNOME < 48 version used to have these scroll view properties, but instead of importing all types for that, just type that one manually
interface OldScrollView {
  vscroll: HasAdjustment;
  hscroll: HasAdjustment;
}

export type AdjustmentType = 'v' | 'h';

export function getScrollViewAdjustment(
  scrollView: St.ScrollView,
  type_or_vertical: AdjustmentType | boolean,
): St.Adjustment {
  if (scrollView.vadjustment !== undefined) {
    if (type_or_vertical === 'v' || type_or_vertical == true) {
      return scrollView.vadjustment;
    }
    return scrollView.hadjustment;
  } else {
    if (type_or_vertical === 'v' || type_or_vertical == true) {
      return (scrollView as any as OldScrollView).vscroll.adjustment;
    }
    return (scrollView as any as OldScrollView).hscroll.adjustment;
  }
}

export function setScrollViewAdjustment(scrollView: St.ScrollView, type: AdjustmentType): St.Adjustment {
  if (scrollView.vadjustment !== undefined) {
    if (type === 'v') {
      return scrollView.vadjustment;
    }
    return scrollView.hadjustment;
  } else {
    if (type === 'v') {
      return (scrollView as any as OldScrollView).vscroll.adjustment;
    }
    return (scrollView as any as OldScrollView).hscroll.adjustment;
  }
}

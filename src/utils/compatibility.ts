import type Gda5 from '@girs/gda-5.0';
import type Gda6 from '@girs/gda-6.0';
import GLib from '@girs/glib-2.0';
import { Notification, Source as MessageTraySource } from '@girs/gnome-shell/dist/ui/messageTray';
import St from '@girs/st-14';

// compatibility functions for Gda 5.0 and 6.0

function isGda6Builder(builder: Gda5.SqlBuilder | Gda6.SqlBuilder): builder is Gda6.SqlBuilder {
  return builder.add_expr_value.length === 1;
}

/**
 * This is hack for libgda6 <> libgda5 compatibility.
 *
 * @param value any
 * @returns expr id
 */
export function add_expr_value(builder: Gda5.SqlBuilder | Gda6.SqlBuilder, value: any): number {
  if (isGda6Builder(builder)) {
    return builder.add_expr_value(value);
  }

  return builder.add_expr_value(null, value);
}

// compatibility functions for gnome-shell 45 / 46

function isGnome45Notifications(): boolean {
  return MessageTraySource.prototype.addNotification === undefined;
}

export function newNotification(
  source: MessageTraySource,
  text: string,
  banner: string,
  transient_: boolean,
  params: Notification.Params,
): Notification {
  if (isGnome45Notifications()) {
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
  if (isGnome45Notifications()) {
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

export type AdjustmentType = 'v' | 'h';

export function getScrollViewAdjustment(scrollView: St.ScrollView, type: AdjustmentType): St.Adjustment {
  if (scrollView.vadjustment !== undefined) {
    if (type === 'v') {
      return scrollView.vadjustment;
    }
    return scrollView.hadjustment;
  } else {
    if (type === 'v') {
      return scrollView.vscroll.adjustment;
    }
    return scrollView.hscroll.adjustment;
  }
}

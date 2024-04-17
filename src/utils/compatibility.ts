import type Gda5 from '@girs/gda-5.0';
import type Gda6 from '@girs/gda-6.0';
import GLib from '@girs/glib-2.0';
import { Source as MessageTraySource } from '@girs/gnome-shell/dist/ui/messageTray';
import { Notification } from '@girs/gnome-shell/dist/ui/messageTray';
import { Source as MessageTraySource45 } from '@girs/gnome-shell-45/dist/ui/messageTray';
import { Notification as Notification45 } from '@girs/gnome-shell-45/dist/ui/messageTray';

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

// compatibility functions for gnome 45 / 46

function isGnome45(): boolean {
  return MessageTraySource.prototype.addNotification === undefined;
}

export function newNotification(
  source: MessageTraySource | MessageTraySource45,
  text: string,
  banner: string,
  params: Notification.Params,
): Notification | Notification45 {
  if (isGnome45()) {
    return new Notification45(source as MessageTraySource45, text, banner, {
      datetime: GLib.DateTime.new_now_local(),
      ...params,
    });
  }

  return new Notification({
    source: source as MessageTraySource,
    title: text,
    body: banner,
    datetime: GLib.DateTime.new_now_local(),
    ...params,
  });
}

export function newMessageTraySource(title: string, iconName: string): MessageTraySource | MessageTraySource45 {
  if (isGnome45()) {
    return new MessageTraySource45(title, iconName);
  }

  return new MessageTraySource({ title, iconName });
}

export function addNotification(
  source: MessageTraySource | MessageTraySource45,
  notification: Notification | Notification45,
): void {
  if (isGnome45()) {
    (source as MessageTraySource45).showNotification(notification as Notification45);
  } else {
    (source as MessageTraySource).addNotification(notification as Notification);
  }
}

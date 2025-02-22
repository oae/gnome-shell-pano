import Clutter from '@girs/clutter-16';
import Cogl from '@girs/cogl-16';
import GdkPixbuf from '@girs/gdkpixbuf-2.0';
import Gio from '@girs/gio-2.0';
import type { Extension } from '@girs/gnome-shell/dist/extensions/extension';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import * as animationUtils from '@girs/gnome-shell/dist/misc/animationUtils';
import { Monitor, MonitorConstraint } from '@girs/gnome-shell/dist/ui/layout';
import * as main from '@girs/gnome-shell/dist/ui/main';
import type { Notification, Source as MessageTraySource } from '@girs/gnome-shell/dist/ui/messageTray';
import Shell from '@girs/shell-16';
import St from '@girs/st-16';
import { gettext } from '@pano/utils/shell';

import { addNotification, newMessageTraySource, newNotification } from './compatibility';
import { setBytesCompat } from './shell_compatibility';

const global = Shell.Global.get();

export const notify = (
  ext: ExtensionBase,
  text: string,
  body: string,
  iconOrPixbuf?: GdkPixbuf.Pixbuf | Gio.Icon,
  pixelFormat?: Cogl.PixelFormat,
): void => {
  const _ = gettext(ext);
  const source = newMessageTraySource(_('Pano'), 'edit-copy-symbolic');
  main.messageTray.add(source as MessageTraySource);
  let notification: Notification;
  if (iconOrPixbuf) {
    if (iconOrPixbuf instanceof GdkPixbuf.Pixbuf) {
      const content = St.ImageContent.new_with_preferred_size(
        iconOrPixbuf.width,
        iconOrPixbuf.height,
      ) as St.ImageContent;
      setBytesCompat(
        content,
        iconOrPixbuf.read_pixel_bytes(),
        pixelFormat || Cogl.PixelFormat.RGBA_8888,
        iconOrPixbuf.width,
        iconOrPixbuf.height,
        iconOrPixbuf.rowstride,
      );

      notification = newNotification(source, text, body, true, { gicon: content });
    } else {
      notification = newNotification(source, text, body, true, { gicon: iconOrPixbuf });
    }
  } else {
    notification = newNotification(source, text, body, true, {});
  }

  addNotification(source, notification);
};

export const wiggle = (actor: Clutter.Actor, { offset, duration, wiggleCount }: animationUtils.WiggleParams) =>
  animationUtils.wiggle(actor, { offset, duration, wiggleCount });

export const wm = main.wm;

export const getMonitors = (): Monitor[] => main.layoutManager.monitors;

export const getMonitorIndexForPointer = () => {
  const [x, y] = global.get_pointer();
  const monitors = getMonitors();

  for (let i = 0; i <= monitors.length; i++) {
    const monitor: Monitor | undefined | null = monitors[i];

    //TODO: debug this issue, sometimes (around 20% of the time) monitor[1] (on my dual monitor setup) is undefined
    if (!monitor) {
      continue;
    }

    if (x >= monitor.x && x < monitor.x + monitor.width && y >= monitor.y && y < monitor.y + monitor.height) {
      return i;
    }
  }

  return main.layoutManager.primaryIndex;
};

export const getMonitorConstraint = () =>
  new MonitorConstraint({
    index: getMonitorIndexForPointer(),
  });

export const addTopChrome = (actor: Clutter.Actor, options?: any) => main.layoutManager.addTopChrome(actor, options);
export const removeChrome = (actor: Clutter.Actor) => main.layoutManager.removeChrome(actor);

let virtualKeyboard: null | Clutter.VirtualInputDevice = null;

export const getVirtualKeyboard = () => {
  if (virtualKeyboard) {
    return virtualKeyboard;
  }

  virtualKeyboard = Clutter.get_default_backend()
    .get_default_seat()
    .create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);

  return virtualKeyboard;
};

export const removeVirtualKeyboard = () => {
  virtualKeyboard = null;
};

export const addToStatusArea = (ext: ExtensionBase, button: any) => {
  main.panel.addToStatusArea(ext.uuid, button, 1, 'right');
};

export const openExtensionPreferences = (ext: Extension) => ext.openPreferences();

export const WINDOW_POSITIONS = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
};

export const getAlignment = (position: number): [Clutter.ActorAlign, Clutter.ActorAlign] => {
  switch (position) {
    case WINDOW_POSITIONS.TOP:
      return [Clutter.ActorAlign.FILL, Clutter.ActorAlign.START];
    case WINDOW_POSITIONS.RIGHT:
      return [Clutter.ActorAlign.END, Clutter.ActorAlign.FILL];
    case WINDOW_POSITIONS.BOTTOM:
      return [Clutter.ActorAlign.FILL, Clutter.ActorAlign.END];
    case WINDOW_POSITIONS.LEFT:
      return [Clutter.ActorAlign.START, Clutter.ActorAlign.FILL];
  }

  return [Clutter.ActorAlign.FILL, Clutter.ActorAlign.END];
};

export const isVertical = (position: number) => {
  return position === WINDOW_POSITIONS.LEFT || position === WINDOW_POSITIONS.RIGHT;
};

import { Actor, ActorAlign, get_default_backend, InputDeviceType, VirtualInputDevice } from '@gi-types/clutter10';
import { Pixbuf } from '@gi-types/gdkpixbuf2';
import { Icon } from '@gi-types/gio2';
import { DateTime } from '@gi-types/glib2';
import { Global } from '@gi-types/shell0';
import { ImageContent } from '@gi-types/st1';
import * as util from '@gnome-shell/misc/util';
import * as layout from '@gnome-shell/ui/layout';
import * as main from '@gnome-shell/ui/main';
import * as messageTray from '@gnome-shell/ui/messageTray';
import { PixelFormat } from '@imports/cogl2';
import { _, getCurrentExtension } from '@pano/utils/shell';

const global = Global.get();

export const notify = (text: string, body: string, iconOrPixbuf?: Pixbuf | Icon, pixelFormat?: PixelFormat): void => {
  const source = new messageTray.Source(_('Pano'), 'edit-copy-symbolic');
  messageTray.add(source);
  let notification;
  if (iconOrPixbuf) {
    if (iconOrPixbuf instanceof Pixbuf) {
      const content = ImageContent.new_with_preferred_size(iconOrPixbuf.width, iconOrPixbuf.height) as ImageContent;
      content.set_bytes(
        iconOrPixbuf.read_pixel_bytes(),
        pixelFormat || PixelFormat.RGBA_8888,
        iconOrPixbuf.width,
        iconOrPixbuf.height,
        iconOrPixbuf.rowstride,
      );

      notification = new messageTray.Notification(source, text, body, {
        datetime: DateTime.new_now_local(),
        gicon: content,
      });
    } else {
      notification = new messageTray.Notification(source, text, body, {
        datetime: DateTime.new_now_local(),
        gicon: iconOrPixbuf,
      });
    }
  } else {
    notification = new messageTray.Notification(source, text, body);
  }

  notification.setTransient(true);
  source.showNotification(notification);
};

export const wiggle = (
  actor: Actor,
  { offset, duration, wiggleCount }: { offset?: number; duration?: number; wiggleCount?: number },
) => util.wiggle(actor, { offset, duration, wiggleCount });

export const wm = main.wm;

export const getMonitors = (): Monitor[] => main.layoutManager.monitors;

export const getMonitorIndexForPointer = () => {
  const [x, y] = global.get_pointer();
  const monitors = getMonitors();

  for (let i = 0; i <= monitors.length; i++) {
    const monitor = monitors[i];

    if (x >= monitor.x && x < monitor.x + monitor.width && y >= monitor.y && y < monitor.y + monitor.height) {
      return i;
    }
  }

  return main.layoutManager.primaryIndex;
};

export const getMonitorConstraint = () =>
  new layout.MonitorConstraint({
    index: getMonitorIndexForPointer(),
  });

export const getMonitorConstraintForIndex = (index: number) =>
  new layout.MonitorConstraint({
    index,
  });

export const addTopChrome = (actor: Actor, options?: any) => main.layoutManager.addTopChrome(actor, options);
export const removeChrome = (actor: Actor) => main.layoutManager.removeChrome(actor);

let virtualKeyboard: null | VirtualInputDevice = null;

export const getVirtualKeyboard = () => {
  if (virtualKeyboard) {
    return virtualKeyboard;
  }

  virtualKeyboard = get_default_backend().get_default_seat().create_virtual_device(InputDeviceType.KEYBOARD_DEVICE);

  return virtualKeyboard;
};

export const removeVirtualKeyboard = () => {
  if (virtualKeyboard) {
    virtualKeyboard.run_dispose();
    virtualKeyboard = null;
  }
};

export const addToStatusArea = (ext: any, button: any) => {
  main.panel.addToStatusArea(getCurrentExtension(ext).metadata.uuid, button, 1, 'right');
};

export const openExtensionPreferences = (ext: any) => ext.openPreferences();

export const WINDOW_POSITIONS = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
};

export const getAlignment = (position: number) => {
  switch (position) {
    case WINDOW_POSITIONS.TOP:
      return [ActorAlign.FILL, ActorAlign.START];
    case WINDOW_POSITIONS.RIGHT:
      return [ActorAlign.END, ActorAlign.FILL];
    case WINDOW_POSITIONS.BOTTOM:
      return [ActorAlign.FILL, ActorAlign.END];
    case WINDOW_POSITIONS.LEFT:
      return [ActorAlign.START, ActorAlign.FILL];
  }

  return [ActorAlign.FILL, ActorAlign.END];
};

export const isVertical = (position: number) => {
  return position === WINDOW_POSITIONS.LEFT || position === WINDOW_POSITIONS.RIGHT;
};

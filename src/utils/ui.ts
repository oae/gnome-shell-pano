import { Actor, get_default_backend, InputDeviceType, VirtualInputDevice } from '@gi-types/clutter10';
import { Global } from '@gi-types/shell0';
import { getCurrentExtension } from '@pano/utils/shell';

const global = Global.get();

export const notify = (text: string, body: string): void => imports.ui.main.notify(text, body);

export const wm = imports.ui.main.wm;

export const getMonitors = (): Monitor[] => imports.ui.main.layoutManager.monitors;

export const getMonitorIndexForPointer = () => {
  const [x, y] = global.get_pointer();
  const monitors = getMonitors();

  for (let i = 0; i <= monitors.length; i++) {
    const monitor = monitors[i];

    if (x >= monitor.x && x < monitor.x + monitor.width && y >= monitor.y && y < monitor.y + monitor.height) {
      return i;
    }
  }

  return imports.ui.main.layoutManager.primaryIndex;
};

export const getMonitorConstraint = () =>
  new imports.ui.layout.MonitorConstraint({
    index: getMonitorIndexForPointer(),
  });

export const getMonitorConstraintForIndex = (index: number) =>
  new imports.ui.layout.MonitorConstraint({
    index,
  });

export const addTopChrome = (actor: Actor, options?: any) => imports.ui.main.layoutManager.addTopChrome(actor, options);
export const removeChrome = (actor: Actor) => imports.ui.main.layoutManager.removeChrome(actor);

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

export const addToStatusArea = (button: any) => {
  imports.ui.main.panel.addToStatusArea(getCurrentExtension().metadata.uuid, button, 1, 'right');
};

export const openExtensionPrefs = () => imports.misc.extensionUtils.openPrefs();

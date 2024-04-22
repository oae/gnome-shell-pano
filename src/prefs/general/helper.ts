import Gtk4 from '@girs/gtk-4.0';
import { errorLogger } from '@pano/utils/shell';

const debugError = errorLogger('helper');

export function getAcceleratorName(keyval: number, keycode: number, mask: number, key: string): string | null {
  const globalShortcut = Gtk4.accelerator_name_with_keycode(null, keyval, keycode, mask);

  //TODO: better error handling
  if (globalShortcut === null) {
    debugError(`Couldn't get keycode for the value '${key}'`);
    return null;
  }

  return globalShortcut;
}

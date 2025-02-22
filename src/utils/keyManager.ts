import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Meta from '@girs/meta-16';
import Shell from '@girs/shell-16';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { wm } from '@pano/utils/ui';
export class KeyManager {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    this.settings = getCurrentExtensionSettings(ext);
  }

  stopListening(gsettingsField: string): void {
    wm.removeKeybinding(gsettingsField);
  }

  listenFor(gsettingsField: string, callback: () => any): void {
    wm.addKeybinding(gsettingsField, this.settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, callback);
  }
}

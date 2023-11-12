import Gio from '@girs/gio-2.0';
import Meta from '@girs/meta-12';
import Shell from '@girs/shell-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
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

import { Settings } from '@gi-types/gio2';
import { KeyBindingFlags } from '@gi-types/meta10';
import { ActionMode } from '@gi-types/shell0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { wm } from '@pano/utils/ui';
export class KeyManager {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    this.settings = getCurrentExtensionSettings(ext);
  }

  stopListening(gsettingsField: string): void {
    wm.removeKeybinding(gsettingsField);
  }

  listenFor(gsettingsField: string, callback: () => any): void {
    wm.addKeybinding(gsettingsField, this.settings, KeyBindingFlags.NONE, ActionMode.ALL, callback);
  }
}

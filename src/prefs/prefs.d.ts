import { ExtensionPreferences as ExtensionPreferencesOriginal } from '@girs/gnome-shell/dist/extensions/prefs';
export { gettext, ngettext, pgettext } from '@girs/gnome-shell/dist/extensions/prefs';

export class ExtensionPreferences extends ExtensionPreferencesOriginal {
  /**
   * @description This is only the type, that overrides the original one, so that we have backwards compatibility
   * This returns "Promise<void> | void" instead of just "Promise<void>"
   */
  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> | void;
}

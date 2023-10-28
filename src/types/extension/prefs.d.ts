import Adw from '@girs/adw-1';
import GnomeShell from '@girs/gnome-shell';

import { ExtensionBase } from './extension';

export type gettext = typeof GnomeShell.misc.extensionUtils.gettext;
export type ngettext = typeof GnomeShell.misc.extensionUtils.ngettext;
//TODO how to solve this better (atm this is just a copy of the @girs/gnome-shell' internals + added gnome 45 types)

export abstract class ExtensionPreferences extends ExtensionBase {
  abstract fillPreferencesWindow(window: Adw.PreferencesWindow): void;
}

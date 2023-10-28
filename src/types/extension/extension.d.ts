import Gio from '@girs/gio-2.0';
import GnomeShell from '@girs/gnome-shell';
export type ExtensionType = typeof GnomeShell.misc.extensionUtils.ExtensionType;

//TODO how to solve this better (atm this is just a copy of the @girs/gnome-shell' internals + added gnome 45 types)
export interface ExtensionMetadata {
  uuid: string;
  name?: string;
  description?: string;
  version?: string;
  url?: string;
  'shell-version'?: string[];
  'settings-schema'?: string;
  'gettext-domain'?: string;
  'original-author'?: string[];
  'extension-id'?: string;
}

export type GetTextString = string & { format: (...args: any[]) => string };

export class ExtensionBase {
  // >= gnome 45
  getSettings(): Gio.Settings;
  openPreferences(): null;

  uuid: string;
  path: string;
  dir: Gio.File;
  metadata: ExtensionMetadata;

  gettext(str: string): GetTextString;
  ngettext(str: string, strPlural: string, n: number): GetTextString;
}

export abstract class Extension extends ExtensionBase {
  constructor(props: ExtensionMetadata);

  abstract enable(): void;

  abstract disable(): void;
}

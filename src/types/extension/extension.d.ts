import { File, Settings } from '@gi-types/gio2';
import GnomeShell from '@girs/gnome-shell';
export type ExtensionType = typeof GnomeShell.misc.extensionUtils.ExtensionType;

export type GetTextString = string & { format: (...args: any[]) => string };

export function gettext(str: string): GetTextString;
export function ngettext(str: string, strPlural: string, n: number): GetTextString;
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
export class ExtensionBase {
  // >= gnome 45
  getSettings(): Settings;
  openPreferences(): null;

  uuid: string;
  path: string;
  dir: File;
  metadata: ExtensionMetadata;
}

export abstract class Extension extends ExtensionBase {
  constructor(props: any);

  abstract enable(): void;

  abstract disable(): void;
}

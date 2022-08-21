import { File, Settings } from '@gi-types/gio2';
import { get_user_cache_dir, get_user_data_dir } from '@gi-types/glib2';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    log(`[pano] [${prefix}] ${content}`);

export const getAppDataPath = (): string => `${get_user_data_dir()}/${getCurrentExtension().metadata.uuid}`;

export const getImagesPath = (): string => `${getAppDataPath()}/images`;

export const getCachePath = (): string => `${get_user_cache_dir()}/${getCurrentExtension().metadata.uuid}`;

export const setupAppDirs = (): void => {
  const appDataPath = File.new_for_path(getImagesPath());
  if (!appDataPath.query_exists(null)) {
    appDataPath.make_directory_with_parents(null);
  }
  const cachePath = File.new_for_path(getCachePath());
  if (!cachePath.query_exists(null)) {
    cachePath.make_directory_with_parents(null);
  }
};

export const getCurrentExtension = (): any => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();
